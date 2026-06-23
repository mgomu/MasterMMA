"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { miembros, pagos } from "@/db/schema";
import { memberSchema, createMemberSchema } from "@/lib/validators";
import { todayISO } from "@/lib/utils";
import { calcDueDate } from "@/lib/membership";
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

  const parsed = createMemberSchema.safeParse({
    nombre: String(formData.get("nombre") ?? "").trim(),
    correo: String(formData.get("correo") ?? "").trim(),
    telefono: String(formData.get("telefono") ?? "").trim(),
    documento: String(formData.get("documento") ?? "").trim(),
    contactoEmergencia: String(formData.get("contactoEmergencia") ?? "").trim(),
    fechaNacimiento: String(formData.get("fechaNacimiento") ?? "").trim(),
    fechaPago: String(formData.get("fechaPago") ?? "").trim() || todayISO(),
    monto: String(formData.get("monto") ?? "").trim(),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  // Al crear la persona asumimos que ya pagó: la fecha de pago define el
  // inicio de la suscripción y el vencimiento (= fecha de pago + 1 mes,
  // decisión del PRD Anexo C). También registramos el pago en `pagos`.
  const fechaPago = parsed.data.fechaPago;
  const monto =
    parsed.data.monto && parsed.data.monto.length > 0 ? parsed.data.monto : null;
  const due = calcDueDate(new Date(`${fechaPago}T12:00:00Z`));
  const fechaVencimiento = due.toISOString().slice(0, 10);

  try {
    const [created] = await db
      .insert(miembros)
      .values({
        nombre: parsed.data.nombre,
        correo: parsed.data.correo,
        telefono: nullable(formData.get("telefono")),
        documento: nullable(formData.get("documento")),
        contactoEmergencia: nullable(formData.get("contactoEmergencia")),
        fechaNacimiento: nullable(formData.get("fechaNacimiento")),
        fechaInicio: fechaPago,
        fechaVencimiento,
      })
      .returning({ id: miembros.id });

    if (!created) {
      return { ok: false, error: "No se pudo crear la persona." };
    }

    await db.insert(pagos).values({
      miembroId: created.id,
      fechaPago,
      monto,
      registradoPor: session.user.id ?? null,
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
