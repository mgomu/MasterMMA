import nodemailer from "nodemailer";
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
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  if (!user || !pass || !from) {
    return { ok: false, error: "Faltan SMTP_USER, SMTP_PASS o SMTP_FROM." };
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
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });
    await transporter.sendMail({ from, to, subject, text });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al enviar el correo.",
    };
  }
}