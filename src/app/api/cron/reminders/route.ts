import { NextResponse } from "next/server";
import { db } from "@/db";
import { miembros, recordatoriosEnviados } from "@/db/schema";
import { dueRemindersForToday } from "@/lib/reminders";
import { sendReminderEmail } from "@/lib/email";

// Lee headers/DB en cada corrida → siempre dinámico.
export const dynamic = "force-dynamic";

// Las fechas `date` vienen como `YYYY-MM-DD`; las parseamos a mediodía UTC para
// que la comparación de días de calendario no se desfase por zona horaria.
function parseDate(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const today = new Date();

  const [rows, sent] = await Promise.all([
    db.select().from(miembros),
    db.select().from(recordatoriosEnviados),
  ]);

  const candidates = dueRemindersForToday(
    rows.map((m) => ({
      id: m.id,
      correo: m.correo,
      nombre: m.nombre,
      fechaVencimiento: parseDate(m.fechaVencimiento),
    })),
    sent.map((s) => ({
      miembroId: s.miembroId,
      tipo: s.tipo,
      fechaVencimiento: parseDate(s.fechaVencimiento),
    })),
    today,
  );

  let enviados = 0;
  let fallidos = 0;

  for (const { miembro, tipo } of candidates) {
    const fechaVencimiento = miembro.fechaVencimiento.toISOString().slice(0, 10);
    const res = await sendReminderEmail({
      to: miembro.correo,
      nombre: miembro.nombre,
      tipo,
      fechaVencimiento,
    });

    if (!res.ok) {
      // No se registra → se reintenta en la siguiente corrida (PRD §6.5).
      fallidos += 1;
      continue;
    }

    try {
      await db.insert(recordatoriosEnviados).values({
        miembroId: miembro.id,
        tipo,
        fechaVencimiento,
      });
      enviados += 1;
    } catch {
      // La constraint única (miembro_id, tipo, fecha_vencimiento) ya cubrió
      // este envío en una corrida concurrente/reintento: lo ignoramos.
    }
  }

  return NextResponse.json({ enviados, fallidos });
}
