"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { miembros, pagos } from "@/db/schema";
import { paymentSchema } from "@/lib/validators";
import { calcDueDate } from "@/lib/membership";

export type PaymentActionState = { ok: boolean; error?: string };

/** Fecha de hoy como `YYYY-MM-DD` (las columnas `date` se guardan como string). */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function registerPayment(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autorizado." };

  const miembroId = String(formData.get("miembroId") ?? "");
  if (!miembroId) return { ok: false, error: "Falta el identificador del miembro." };

  const parsed = paymentSchema.safeParse({
    fechaPago: String(formData.get("fechaPago") ?? "").trim() || todayISO(),
    monto: String(formData.get("monto") ?? "").trim(),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const fechaPago = parsed.data.fechaPago;
  const monto = parsed.data.monto && parsed.data.monto.length > 0 ? parsed.data.monto : null;

  // Vencimiento = fecha de pago + 1 mes (decisión del PRD Anexo C). Parseamos a
  // mediodía UTC para que el cálculo por día de calendario no se desfase.
  const due = calcDueDate(new Date(`${fechaPago}T12:00:00Z`));
  const fechaVencimiento = due.toISOString().slice(0, 10);

  // ¿Primer pago? Entonces además fijamos la fecha de inicio real de la suscripción.
  const prior = await db
    .select({ id: pagos.id })
    .from(pagos)
    .where(eq(pagos.miembroId, miembroId))
    .limit(1);
  const isFirstPayment = prior.length === 0;

  try {
    // `db.batch` corre ambas sentencias en una sola transacción atómica; el
    // driver neon-http no soporta `db.transaction` interactivo.
    await db.batch([
      db.insert(pagos).values({
        miembroId,
        fechaPago,
        monto,
        registradoPor: session.user.id ?? null,
      }),
      db
        .update(miembros)
        .set({
          fechaVencimiento,
          ...(isFirstPayment ? { fechaInicio: fechaPago } : {}),
        })
        .where(eq(miembros.id, miembroId)),
    ]);
  } catch {
    return { ok: false, error: "No se pudo registrar el pago." };
  }

  revalidatePath("/");
  revalidatePath(`/miembros/${miembroId}`);
  return { ok: true };
}
