import { differenceInCalendarDays } from "date-fns";

/**
 * Suma un mes a la fecha de pago, tratando la fecha como un día de calendario
 * en UTC para evitar desfases por zona horaria (las fechas se guardan como
 * `date` sin hora en Postgres). Si el día no existe en el mes destino
 * (p. ej. 31 ene -> feb), se ajusta al último día de ese mes.
 */
export function calcDueDate(paymentDate: Date): Date {
  const year = paymentDate.getUTCFullYear();
  const month = paymentDate.getUTCMonth();
  const day = paymentDate.getUTCDate();
  // Último día del mes destino (mes+2 día 0 = último día de mes+1).
  const daysInTargetMonth = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
  const clampedDay = Math.min(day, daysInTargetMonth);
  return new Date(Date.UTC(year, month + 1, clampedDay));
}

export type MembershipStatus = "activo" | "por_vencer" | "vencido";

/**
 * Estado de la membresía según los días que faltan para el vencimiento:
 * vencido (`< 0`), por_vencer (`0–7`, inclusive) o activo (`> 7`).
 * Compara días de calendario, así que la hora del día no afecta el resultado.
 */
export function membershipStatus(
  dueDate: Date,
  today: Date = new Date(),
): MembershipStatus {
  const days = differenceInCalendarDays(dueDate, today);
  if (days < 0) return "vencido";
  if (days <= 7) return "por_vencer";
  return "activo";
}

export type ReminderType = "7d" | "3d" | "1d";

/**
 * Tipo de recordatorio a enviar hoy según los días exactos hasta el
 * vencimiento (7, 3 o 1). `null` si hoy no es un día de aviso.
 */
export function reminderTypeForDueDate(
  dueDate: Date,
  today: Date = new Date(),
): ReminderType | null {
  const days = differenceInCalendarDays(dueDate, today);
  if (days === 7) return "7d";
  if (days === 3) return "3d";
  if (days === 1) return "1d";
  return null;
}
