# App de Gestión de Membresías (Gimnasio MMA) — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Construir un MVP donde varios administradores inician sesión, gestionan miembros y pagos, ven el estado de cada membresía de un vistazo, y el sistema envía solos los correos de recordatorio (7/3/1 días) antes del vencimiento.

**Architecture:** App full-stack en Next.js (App Router) desplegada en Vercel. Base de datos Neon Postgres vía Drizzle ORM. Autenticación con Auth.js (NextAuth v5) usando credenciales (correo + contraseña con bcrypt). Lógica de negocio pura (cálculo de vencimiento, estado, selección de recordatorios) aislada en módulos testeables. Los recordatorios los dispara un endpoint `/api/cron/reminders` invocado diariamente por Vercel Cron, protegido con `CRON_SECRET`, que consulta vencimientos y envía correos con Resend evitando duplicados.

**Tech Stack:** Next.js 15 (App Router, TypeScript) · Neon Postgres · Drizzle ORM + drizzle-kit · Auth.js v5 (credentials) · bcryptjs · Tailwind CSS + shadcn/ui · Resend · Vercel Cron · Vitest (lógica) · date-fns · Zod (validación).

**Decisiones clave fijadas:**
- Vencimiento = **fecha del pago + 1 mes** (decisión consciente del PRD Anexo C; los días previos "se pierden" al renovar antes de tiempo).
- Estados: **Vencido** (`vencimiento < hoy`) · **Por vencer** (`hoy ≤ vencimiento ≤ hoy+7`) · **Activo** (`vencimiento > hoy+7`).
- Dedup de recordatorios por `(miembro_id, tipo, fecha_vencimiento)` — así una renovación habilita un nuevo ciclo de avisos (mejora sobre el modelo del PRD, que solo usaba `tipo`).
- Nombres de tablas/columnas en español (`miembros`, `pagos`, `recordatorios_enviados`) para alinear con el PRD; código en inglés.
- Zona horaria del cron: Vercel ejecuta en UTC. Programamos `0 13 * * *` (≈ 8:00 AM hora Colombia, UTC-5) y comparamos fechas como `date` (sin hora) para evitar desfases.

---

## Variables de entorno (referencia)

Se irán necesitando por fase. Guardar en `.env.local` (dev) y en Vercel (prod):

```
DATABASE_URL=postgresql://...neon...      # Fase 0
AUTH_SECRET=<openssl rand -base64 32>     # Fase 1
RESEND_API_KEY=re_...                     # Fase 5
EMAIL_FROM="Gimnasio MMA <recordatorios@tudominio.com>"  # Fase 5
CRON_SECRET=<openssl rand -base64 32>     # Fase 5
```

---

## Fase 0 — Scaffolding del proyecto

### Task 0.1: Crear el proyecto Next.js

**Files:**
- Create: todo el árbol base del proyecto en la raíz `/Volumes/DATA/Proyectos/MasterMMA`

**Step 1: Scaffolding no interactivo**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --import-alias "@/*" --use-npm --yes
```
Expected: estructura `src/app`, `package.json`, `tailwind.config.ts` creados.

**Step 2: Verificar arranque**

Run: `npm run dev` (Ctrl-C tras confirmar). Expected: server en `http://localhost:3000` sin errores.

**Step 3: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold Next.js app"
```

### Task 0.2: Dependencias y configuración base

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`, `.env.local`, `.env.example`

**Step 1: Instalar dependencias**

Run:
```bash
npm i drizzle-orm @neondatabase/serverless next-auth@beta bcryptjs zod date-fns resend
npm i -D drizzle-kit vitest @types/bcryptjs tsx dotenv
```

**Step 2: Configurar Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```
Run `npm i -D vite-tsconfig-paths` y añade el plugin si hace falta resolver `@/`. Añade script `"test": "vitest run"` en `package.json`.

**Step 3: Crear `.env.example`** con las variables listadas arriba (sin valores reales). Copia a `.env.local` y rellena `DATABASE_URL` con la URL de Neon (créala con `vercel:env` o desde el dashboard de Neon; usar la connection string pooled).

**Step 4: Commit**

```bash
git add -A && git commit -m "chore: add deps and test config"
```

---

## Fase 1 — Lógica de negocio pura (TDD primero)

> Aislar la lógica determinista permite testearla sin DB ni red. Es el corazón del producto.

### Task 1.1: Cálculo de fecha de vencimiento

**Files:**
- Create: `src/lib/membership.ts`
- Test: `src/lib/membership.test.ts`

**Step 1: Test que falla**

```ts
import { describe, it, expect } from "vitest";
import { calcDueDate } from "./membership";

describe("calcDueDate", () => {
  it("suma un mes a la fecha de pago", () => {
    expect(calcDueDate(new Date("2026-01-15"))).toEqual(new Date("2026-02-15"));
  });
  it("maneja fin de mes (31 ene -> 28 feb)", () => {
    expect(calcDueDate(new Date("2026-01-31"))).toEqual(new Date("2026-02-28"));
  });
});
```

**Step 2:** Run `npm test` → FAIL ("calcDueDate not exported").

**Step 3: Implementación mínima**

```ts
import { addMonths } from "date-fns";
export function calcDueDate(paymentDate: Date): Date {
  return addMonths(paymentDate, 1);
}
```

**Step 4:** Run `npm test` → PASS.

**Step 5: Commit** `git add -A && git commit -m "feat: calcDueDate"`

### Task 1.2: Cálculo de estado de membresía

**Files:**
- Modify: `src/lib/membership.ts`
- Test: `src/lib/membership.test.ts`

**Step 1: Test que falla**

```ts
import { membershipStatus } from "./membership";

describe("membershipStatus", () => {
  const today = new Date("2026-06-17");
  it("vencido cuando la fecha pasó", () => {
    expect(membershipStatus(new Date("2026-06-16"), today)).toBe("vencido");
  });
  it("por vencer dentro de 7 días (incluye hoy y día 7)", () => {
    expect(membershipStatus(new Date("2026-06-17"), today)).toBe("por_vencer");
    expect(membershipStatus(new Date("2026-06-24"), today)).toBe("por_vencer");
  });
  it("activo a más de 7 días", () => {
    expect(membershipStatus(new Date("2026-06-25"), today)).toBe("activo");
  });
});
```

**Step 2:** Run `npm test` → FAIL.

**Step 3: Implementación**

```ts
import { differenceInCalendarDays } from "date-fns";
export type MembershipStatus = "activo" | "por_vencer" | "vencido";

export function membershipStatus(dueDate: Date, today: Date = new Date()): MembershipStatus {
  const days = differenceInCalendarDays(dueDate, today);
  if (days < 0) return "vencido";
  if (days <= 7) return "por_vencer";
  return "activo";
}
```

**Step 4:** Run `npm test` → PASS. **Step 5: Commit.**

### Task 1.3: Selección de recordatorios del día

**Files:**
- Modify: `src/lib/membership.ts`
- Test: `src/lib/membership.test.ts`

**Step 1: Test que falla**

```ts
import { reminderTypeForDueDate } from "./membership";

describe("reminderTypeForDueDate", () => {
  const today = new Date("2026-06-17");
  it("7d cuando vence en 7 días", () => {
    expect(reminderTypeForDueDate(new Date("2026-06-24"), today)).toBe("7d");
  });
  it("3d / 1d", () => {
    expect(reminderTypeForDueDate(new Date("2026-06-20"), today)).toBe("3d");
    expect(reminderTypeForDueDate(new Date("2026-06-18"), today)).toBe("1d");
  });
  it("null si no es día de recordatorio", () => {
    expect(reminderTypeForDueDate(new Date("2026-06-19"), today)).toBeNull();
  });
});
```

**Step 2:** Run `npm test` → FAIL.

**Step 3: Implementación**

```ts
export type ReminderType = "7d" | "3d" | "1d";
export function reminderTypeForDueDate(dueDate: Date, today: Date = new Date()): ReminderType | null {
  const days = differenceInCalendarDays(dueDate, today);
  if (days === 7) return "7d";
  if (days === 3) return "3d";
  if (days === 1) return "1d";
  return null;
}
```

**Step 4:** Run `npm test` → PASS. **Step 5: Commit.**

---

## Fase 2 — Base de datos (Drizzle + Neon)

### Task 2.1: Schema

**Files:**
- Create: `src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.ts`

**Step 1: Definir schema** en `src/db/schema.ts`:

```ts
import { pgTable, uuid, text, date, timestamp, numeric, pgEnum, unique } from "drizzle-orm/pg-core";

export const reminderType = pgEnum("reminder_type", ["7d", "3d", "1d"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const miembros = pgTable("miembros", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  correo: text("correo").notNull(),
  telefono: text("telefono"),
  documento: text("documento"),
  contactoEmergencia: text("contacto_emergencia"),
  fechaNacimiento: date("fecha_nacimiento"),
  fechaInicio: date("fecha_inicio").notNull(),
  fechaVencimiento: date("fecha_vencimiento").notNull(),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

export const pagos = pgTable("pagos", {
  id: uuid("id").defaultRandom().primaryKey(),
  miembroId: uuid("miembro_id").notNull().references(() => miembros.id, { onDelete: "cascade" }),
  fechaPago: date("fecha_pago").notNull(),
  monto: numeric("monto"),
  registradoPor: uuid("registrado_por").references(() => users.id),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
});

export const recordatoriosEnviados = pgTable("recordatorios_enviados", {
  id: uuid("id").defaultRandom().primaryKey(),
  miembroId: uuid("miembro_id").notNull().references(() => miembros.id, { onDelete: "cascade" }),
  tipo: reminderType("tipo").notNull(),
  fechaVencimiento: date("fecha_vencimiento").notNull(),
  fechaEnvio: timestamp("fecha_envio").defaultNow().notNull(),
}, (t) => ({
  uniqEnvio: unique().on(t.miembroId, t.tipo, t.fechaVencimiento),
}));
```

**Step 2: Cliente DB** en `src/db/index.ts`:

```ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

**Step 3: `drizzle.config.ts`**:

```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

**Step 4: Generar y aplicar migración**

Run:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```
Expected: migración creada en `drizzle/` y tablas creadas en Neon. Verificar con el MCP de Neon (`get_database_tables`) o `npx drizzle-kit studio`.

**Step 5: Commit** `git add -A && git commit -m "feat: db schema and migrations"`

### Task 2.2: Script de seed del primer admin

**Files:**
- Create: `src/db/seed.ts`

**Step 1:** Script que crea un admin con email/password de argumentos:

```ts
import { db } from "./index";
import { users } from "./schema";
import bcrypt from "bcryptjs";

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) throw new Error("Uso: tsx src/db/seed.ts <email> <password> [name]");
  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ email, passwordHash, name: name ?? "Admin" });
  console.log("Admin creado:", email);
}
main().then(() => process.exit(0));
```

Añade script en `package.json`: `"seed": "tsx --env-file=.env.local src/db/seed.ts"`.

**Step 2: Crear primer admin**

Run: `npm run seed -- admin@gimnasio.com micontraseña "Admin Principal"`
Expected: "Admin creado". Verificar fila en `users`.

**Step 3: Commit** `git add -A && git commit -m "feat: admin seed script"`

---

## Fase 3 — Autenticación (Auth.js v5)

### Task 3.1: Configurar Auth.js con credenciales

**Files:**
- Create: `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
- Modify: `.env.local` (añadir `AUTH_SECRET`)

**Step 1: `src/auth.ts`**

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = creds?.email as string;
        const password = creds?.password as string;
        if (!email || !password) return null;
        const [u] = await db.select().from(users).where(eq(users.email, email));
        if (!u) return null;
        const ok = await bcrypt.compare(password, u.passwordHash);
        if (!ok) return null;
        return { id: u.id, email: u.email, name: u.name };
      },
    }),
  ],
});
```

**Step 2: Route handler** `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

**Step 3:** Genera `AUTH_SECRET` (`openssl rand -base64 32`) en `.env.local`.

**Step 4: Commit** `git add -A && git commit -m "feat: auth.js credentials setup"`

### Task 3.2: Middleware de protección de rutas

**Files:**
- Create: `src/middleware.ts`

**Step 1:** Proteger todo excepto `/login` y rutas de auth:

```ts
import { auth } from "@/auth";

export default auth((req) => {
  const isLogin = req.nextUrl.pathname.startsWith("/login");
  if (!req.auth && !isLogin) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 2: Commit** `git add -A && git commit -m "feat: route protection middleware"`

### Task 3.3: Página de login

**Files:**
- Create: `src/app/login/page.tsx`

**Step 1:** Form que llama a `signIn("credentials", ...)` vía server action. Muestra error si credenciales inválidas, sin perder el correo escrito. Incluye estados de carga (botón deshabilitado + texto "Entrando...").

**Step 2: Verificación manual**

Run `npm run dev`, ir a `/`, confirmar redirección a `/login`, iniciar sesión con el admin seedeado, confirmar redirección al dashboard (placeholder por ahora).

**Step 3: Commit** `git add -A && git commit -m "feat: login page"`

---

## Fase 4 — CRUD de miembros (PRD pasos 1-2)

> Todas las mutaciones vía Server Actions con validación Zod. Toasts de éxito/error.

### Task 4.1: UI base (shadcn) y layout del dashboard

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/components/ui/*` (shadcn)

**Step 1:** Inicializar shadcn/ui (`npx shadcn@latest init --yes`) e instalar componentes: `button input label table dialog badge sonner card`. Añadir `<Toaster />` (sonner) al layout. El layout muestra header con nombre del admin y botón "Cerrar sesión" (server action `signOut`).

**Step 2: Commit** `git add -A && git commit -m "feat: app shell + shadcn ui"`

### Task 4.2: Validación de miembro (TDD)

**Files:**
- Create: `src/lib/validators.ts`
- Test: `src/lib/validators.test.ts`

**Step 1: Test que falla** — `memberSchema` exige `nombre` no vacío y `correo` válido; campos opcionales pueden faltar.

```ts
import { memberSchema } from "./validators";
it("rechaza correo inválido", () => {
  expect(memberSchema.safeParse({ nombre: "Ana", correo: "no-mail" }).success).toBe(false);
});
it("acepta mínimos obligatorios", () => {
  expect(memberSchema.safeParse({ nombre: "Ana", correo: "ana@x.com" }).success).toBe(true);
});
```

**Step 2:** Run `npm test` → FAIL.

**Step 3: Implementación**

```ts
import { z } from "zod";
export const memberSchema = z.object({
  nombre: z.string().min(1, "Nombre obligatorio"),
  correo: z.string().email("Correo inválido"),
  telefono: z.string().optional().or(z.literal("")),
  documento: z.string().optional().or(z.literal("")),
  contactoEmergencia: z.string().optional().or(z.literal("")),
  fechaNacimiento: z.string().optional().or(z.literal("")),
});
```

**Step 4:** Run `npm test` → PASS. **Step 5: Commit.**

### Task 4.3: Server actions de miembros

**Files:**
- Create: `src/app/(app)/actions/members.ts`

**Step 1:** Implementar `createMember`, `updateMember`, `deleteMember`:
- `createMember`: valida con `memberSchema`; `fechaInicio = hoy`; `fechaVencimiento = hoy` (sin pago aún → quedará "por_vencer/vencido"); inserta; `revalidatePath("/")`.
- `updateMember`: permite editar datos + `fechaInicio` + `fechaVencimiento` manualmente (F5).
- `deleteMember`: borra por id (la confirmación vive en UI).
- Cada action requiere sesión (`const session = await auth(); if (!session) throw`).
- Devuelven `{ ok, error? }` para feedback en UI.

**Step 2: Commit** `git add -A && git commit -m "feat: member server actions"`

### Task 4.4: Tabla de miembros + búsqueda + formularios

**Files:**
- Create: `src/app/(app)/page.tsx` (dashboard), `src/components/member-table.tsx`, `src/components/member-form.tsx`, `src/components/delete-member-dialog.tsx`

**Step 1:** `page.tsx` (server component) consulta miembros, calcula estado con `membershipStatus` y renderiza:
- Tabla: nombre, correo, vencimiento, **badge de estado por color** (verde activo / amarillo por_vencer / rojo vencido).
- Búsqueda por nombre/correo (filtro client-side o query param).
- Botón "Nueva persona" → dialog con `member-form`.
- Acciones por fila: editar (dialog) y eliminar (dialog de confirmación).
- Toasts de éxito/error tras cada acción.

**Step 2: Verificación manual:** crear, editar y eliminar una persona; confirmar toasts y refresco de la tabla.

**Step 3: Commit** `git add -A && git commit -m "feat: members dashboard CRUD + search"`

---

## Fase 5 — Pagos, vencimiento y estado (PRD paso 3)

### Task 5.1: Server action de registrar pago

**Files:**
- Create: `src/app/(app)/actions/payments.ts`

**Step 1:** `registerPayment(miembroId, { fechaPago, monto })`:
- `fechaPago` por defecto hoy; `monto` opcional.
- Inserta en `pagos` con `registradoPor = session.user.id`.
- Recalcula `fechaVencimiento = calcDueDate(fechaPago)` y actualiza el miembro (también fija `fechaInicio` si es el primer pago).
- Transacción para insertar pago + actualizar miembro.
- `revalidatePath("/")`. Devuelve `{ ok, error? }`.

**Step 2: Commit** `git add -A && git commit -m "feat: register payment action"`

### Task 5.2: UI de pago e historial

**Files:**
- Create: `src/components/payment-dialog.tsx`, `src/app/(app)/miembros/[id]/page.tsx`

**Step 1:** Botón "Registrar pago" en cada fila → dialog (fecha por defecto hoy, monto opcional). Página de detalle del miembro muestra datos + **historial de pagos** (tabla de `pagos` ordenada desc).

**Step 2: Verificación manual:** registrar pago → vencimiento pasa a hoy+1mes y estado a "activo"; el historial lista el pago.

**Step 3: Commit** `git add -A && git commit -m "feat: payment UI + history"`

### Task 5.3: Contadores del dashboard (F9)

**Files:**
- Modify: `src/app/(app)/page.tsx`
- Create: `src/components/status-counters.tsx`

**Step 1:** Calcular totales de activos / por vencer / vencidos sobre la lista y mostrarlos en cards arriba de la tabla.

**Step 2: Commit** `git add -A && git commit -m "feat: dashboard status counters"`

---

## Fase 6 — Recordatorios automáticos (PRD paso 5, lo más delicado)

### Task 6.1: Lógica de selección de destinatarios (TDD)

**Files:**
- Create: `src/lib/reminders.ts`
- Test: `src/lib/reminders.test.ts`

**Step 1: Test que falla** — `dueRemindersForToday(miembros, alreadySent, today)` devuelve la lista de `{ miembro, tipo }` a enviar, excluyendo los ya enviados (mismo `miembroId+tipo+fechaVencimiento`).

```ts
import { dueRemindersForToday } from "./reminders";
const today = new Date("2026-06-17");
const m = { id: "1", correo: "a@x.com", nombre: "Ana", fechaVencimiento: new Date("2026-06-24") };
it("incluye 7d cuando corresponde y no fue enviado", () => {
  expect(dueRemindersForToday([m], [], today)).toEqual([{ miembro: m, tipo: "7d" }]);
});
it("excluye si ya se envió ese tipo para ese vencimiento", () => {
  const sent = [{ miembroId: "1", tipo: "7d", fechaVencimiento: new Date("2026-06-24") }];
  expect(dueRemindersForToday([m], sent, today)).toEqual([]);
});
```

**Step 2:** Run `npm test` → FAIL.

**Step 3: Implementación** usando `reminderTypeForDueDate` + filtro de dedup por clave `miembroId|tipo|fechaVencimiento(ISO)`.

**Step 4:** Run `npm test` → PASS. **Step 5: Commit.**

### Task 6.2: Plantilla de correo y cliente Resend

**Files:**
- Create: `src/lib/email.ts`
- Modify: `.env.local` (`RESEND_API_KEY`, `EMAIL_FROM`)

**Step 1:** `sendReminderEmail({ to, nombre, tipo, fechaVencimiento })` que construye asunto/cuerpo según `tipo` (7/3/1 días) y llama a `resend.emails.send`. Manejo de error: devuelve `{ ok:false }` sin lanzar, para que un fallo no rompa la corrida.

**Step 2: Setup Resend (manual, fuera de código):** crear cuenta Resend, verificar dominio, generar API key, guardarla en `.env.local` y en Vercel. Hasta verificar dominio, usar `onboarding@resend.dev` como `EMAIL_FROM` para pruebas.

**Step 3: Commit** `git add -A && git commit -m "feat: resend email sender"`

### Task 6.3: Endpoint de cron

**Files:**
- Create: `src/app/api/cron/reminders/route.ts`
- Modify: `.env.local` (`CRON_SECRET`)

**Step 1:** Handler `GET`:
- Verifica `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron envía este header); si no coincide → 401.
- Carga miembros y recordatorios ya enviados; calcula `dueRemindersForToday`.
- Por cada uno: envía correo; si `ok`, inserta en `recordatorios_enviados` (la constraint única protege contra duplicados aun con reintentos).
- Devuelve `{ enviados, fallidos }` en JSON.
- Los fallidos no se registran → se reintentan en la siguiente corrida (PRD §6.5).

**Step 2: Prueba local**

Run: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders`
Expected: JSON con conteo; revisar bandeja de prueba. Crear un miembro con vencimiento = hoy+7 para forzar un envío.

**Step 3: Commit** `git add -A && git commit -m "feat: cron reminders endpoint"`

### Task 6.4: Programar el cron en Vercel

**Files:**
- Create: `vercel.json` (o `vercel.ts`)

**Step 1:** Configurar cron diario:

```json
{
  "crons": [{ "path": "/api/cron/reminders", "schedule": "0 13 * * *" }]
}
```
(13:00 UTC ≈ 08:00 Colombia). Vercel añade automáticamente el header de autorización con `CRON_SECRET` cuando esta var existe en el proyecto.

**Step 2: Commit** `git add -A && git commit -m "chore: schedule daily reminders cron"`

---

## Fase 7 — Deploy y verificación end-to-end

### Task 7.1: Desplegar a Vercel

**Step 1:** Configurar todas las env vars en Vercel (`vercel env add` o dashboard): `DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`.

**Step 2:** Deploy con la skill `vercel:deploy` (`prod`) o `vercel --prod`. Aplicar migraciones contra la DB de prod (`npx drizzle-kit migrate` con la `DATABASE_URL` de prod) y crear el primer admin con el seed apuntando a prod.

**Step 3:** Verificación del camino feliz del PRD §4:
1. Login del admin. ✅
2. Crear persona + registrar pago → vencimiento = hoy+1mes, estado activo. ✅
3. Dashboard con colores y contadores correctos. ✅
4. Disparar el cron manualmente (`curl` con bearer) y confirmar correo recibido + fila en `recordatorios_enviados`. ✅

**Step 4: Commit final / tag** del estado del demo.

---

## Mapa de cobertura del PRD

| PRD | Dónde se cubre |
|-----|----------------|
| F1 Login admins | Fase 3 |
| F2 Crear persona | Task 4.3/4.4 |
| F3 Listar/buscar | Task 4.4 |
| F4 Registrar pago + historial | Task 5.1/5.2 |
| F5 Editar persona/suscripción | Task 4.3 (update con fechas manuales) |
| F6 Eliminar con confirmación | Task 4.4 |
| F7 Estado automático | Task 1.2 + render en 4.4 |
| F8 Recordatorios sin duplicar | Fase 6 |
| F9 Contadores dashboard | Task 5.3 |
| Modelo de datos (Anexo A) | Task 2.1 |
| Correos automáticos (Anexo B) | Fase 6 |
| Decisión "desde día de pago" (Anexo C) | Task 1.1 |

## Riesgos / notas
- **Zona horaria del cron**: Vercel corre en UTC; comparamos `date` puro para no desfasar por horas. Si el gimnasio no está en UTC-5, ajustar el `schedule`.
- **Dominio Resend**: sin dominio verificado los correos caen en spam; bloqueante para el demo "real" pero no para pruebas con `resend.dev`.
- **Auth manual**: al elegir Auth.js credentials (no Supabase Auth), el alta de admins es vía seed/SQL; no hay UI de registro (fuera de alcance del MVP).
- **Plan Hobby de Vercel**: los cron jobs pueden tener límite de frecuencia/ejecución diaria; uno diario está dentro de lo permitido.
