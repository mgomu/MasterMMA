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
