"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { miembros } from "@/db/schema";
import { memberSchema } from "@/lib/validators";
import type { MembershipStatus } from "@/lib/membership";

export type MemberActionState = { ok: boolean; error?: string };

/** Fila de miembro enriquecida con su estado, tal como la consume la UI. */
export type MemberRow = {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  documento: string | null;
  contactoEmergencia: string | null;
  fechaNacimiento: string | null;
  fechaInicio: string;
  fechaVencimiento: string;
  estado: MembershipStatus;
};

/** Fecha de hoy como `YYYY-MM-DD` (las columnas `date` se guardan como string). */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Convierte cadena vacía en `null` para columnas opcionales. */
function nullable(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

/** Valida los campos comunes del miembro a partir del FormData. */
function parseMember(formData: FormData) {
  return memberSchema.safeParse({
    nombre: String(formData.get("nombre") ?? "").trim(),
    correo: String(formData.get("correo") ?? "").trim(),
    telefono: String(formData.get("telefono") ?? "").trim(),
    documento: String(formData.get("documento") ?? "").trim(),
    contactoEmergencia: String(formData.get("contactoEmergencia") ?? "").trim(),
    fechaNacimiento: String(formData.get("fechaNacimiento") ?? "").trim(),
  });
}

export async function createMember(
  _prev: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autorizado." };

  const parsed = parseMember(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  // Sin pago todavía: el vencimiento arranca hoy, así el miembro nace en
  // estado "por_vencer" hasta que se registre el primer pago (Fase 5).
  const today = todayISO();

  try {
    await db.insert(miembros).values({
      nombre: parsed.data.nombre,
      correo: parsed.data.correo,
      telefono: nullable(formData.get("telefono")),
      documento: nullable(formData.get("documento")),
      contactoEmergencia: nullable(formData.get("contactoEmergencia")),
      fechaNacimiento: nullable(formData.get("fechaNacimiento")),
      fechaInicio: today,
      fechaVencimiento: today,
    });
  } catch {
    return { ok: false, error: "No se pudo crear la persona." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function updateMember(
  _prev: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autorizado." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Falta el identificador." };

  const parsed = parseMember(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  // F5: el admin puede ajustar manualmente inicio y vencimiento.
  const fechaInicio = nullable(formData.get("fechaInicio"));
  const fechaVencimiento = nullable(formData.get("fechaVencimiento"));
  if (!fechaInicio || !fechaVencimiento) {
    return { ok: false, error: "Las fechas de inicio y vencimiento son obligatorias." };
  }

  try {
    await db
      .update(miembros)
      .set({
        nombre: parsed.data.nombre,
        correo: parsed.data.correo,
        telefono: nullable(formData.get("telefono")),
        documento: nullable(formData.get("documento")),
        contactoEmergencia: nullable(formData.get("contactoEmergencia")),
        fechaNacimiento: nullable(formData.get("fechaNacimiento")),
        fechaInicio,
        fechaVencimiento,
      })
      .where(eq(miembros.id, id));
  } catch {
    return { ok: false, error: "No se pudo actualizar la persona." };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function deleteMember(id: string): Promise<MemberActionState> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autorizado." };
  if (!id) return { ok: false, error: "Falta el identificador." };

  try {
    await db.delete(miembros).where(eq(miembros.id, id));
  } catch {
    return { ok: false, error: "No se pudo eliminar la persona." };
  }

  revalidatePath("/");
  return { ok: true };
}
