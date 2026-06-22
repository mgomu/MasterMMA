import { Resend } from "resend";
import type { ReminderType } from "./membership";

const DIAS: Record<ReminderType, number> = { "7d": 7, "3d": 3, "1d": 1 };

export type SendReminderArgs = {
  to: string;
  nombre: string;
  tipo: ReminderType;
  // Vencimiento como `YYYY-MM-DD` (columna `date` de Postgres).
  fechaVencimiento: string;
};

export type SendResult = { ok: boolean; error?: string };

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// No lanza nunca: un fallo de envío devuelve { ok:false } para que la corrida
// del cron continúe con el resto de destinatarios (PRD §6.5).
export async function sendReminderEmail({
  to,
  nombre,
  tipo,
  fechaVencimiento,
}: SendReminderArgs): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { ok: false, error: "Faltan RESEND_API_KEY o EMAIL_FROM." };
  }

  const dias = DIAS[tipo];
  const fecha = formatDate(fechaVencimiento);
  const subject =
    dias === 1
      ? "Tu membresía vence mañana"
      : `Tu membresía vence en ${dias} días`;
  const cuando = dias === 1 ? "mañana" : `en ${dias} días`;
  const text = `Hola ${nombre},

Te recordamos que tu membresía del gimnasio vence el ${fecha} (${cuando}).

Acércate a renovarla para no perder el acceso a las clases.

¡Nos vemos en el tatami!`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to, subject, text });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al enviar el correo.",
    };
  }
}
