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

function buildTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  if (!user || !pass || !from) {
    return { error: "Faltan SMTP_USER, SMTP_PASS o SMTP_FROM." } as const;
  }
  return {
    transporter: nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    }),
    from,
  } as const;
}

// No lanza nunca: un fallo de envío devuelve { ok:false } para que la corrida
// del cron continúe con el resto de destinatarios (PRD §6.5).
export async function sendReminderEmail({
  to,
  nombre,
  tipo,
  fechaVencimiento,
}: SendReminderArgs): Promise<SendResult> {
  const built = buildTransporter();
  if ("error" in built) return { ok: false, error: built.error };

  const dias = DIAS[tipo];
  const fecha = formatDate(fechaVencimiento);
  const subject =
    dias === 1
      ? "Tu membresía vence mañana"
      : `Tu membresía vence en ${dias} días`;
  const cuando = dias === 1 ? "mañana" : `en ${dias} días`;
  const text = `Hola ${nombre},

Te recordamos que tu membresía del gimnasio vence el ${fecha} (${cuando}).

Por favor realiza el pago para renovar tu membresía y no perder el acceso a las clases.

`;

  try {
    await built.transporter.sendMail({ from: built.from, to, subject, text });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al enviar el correo.",
    };
  }
}

// Copia al admin (gimnasio): avisa que un miembro está por vencer. Best-effort
// vía `ADMIN_EMAIL`; si no está configurado, no hace nada.
export type SendAdminAlertArgs = {
  adminEmail: string;
  nombreMiembro: string;
  tipo: ReminderType;
  fechaVencimiento: string;
};

export async function sendAdminAlertEmail({
  adminEmail,
  nombreMiembro,
  tipo,
  fechaVencimiento,
}: SendAdminAlertArgs): Promise<SendResult> {
  const built = buildTransporter();
  if ("error" in built) return { ok: false, error: built.error };

  const dias = DIAS[tipo];
  const fecha = formatDate(fechaVencimiento);
  const subject = `Aviso: membresía de ${nombreMiembro} por vencer`;
  const cuando = dias === 1 ? "mañana" : `en ${dias} días`;
  const text = `Hola,

Te avisamos que la membresía de ${nombreMiembro} vence el ${fecha} (${cuando}).

Si corresponde, comunícate con el miembro para gestionar la renovación.

`;

  try {
    await built.transporter.sendMail({
      from: built.from,
      to: adminEmail,
      subject,
      text,
    });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al enviar el correo.",
    };
  }
}