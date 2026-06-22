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
