import { reminderTypeForDueDate, type ReminderType } from "./membership";

export type ReminderMiembro = {
  id: string;
  correo: string;
  nombre: string;
  fechaVencimiento: Date;
};

export type SentReminder = {
  miembroId: string;
  tipo: ReminderType;
  fechaVencimiento: Date;
};

export type DueReminder = {
  miembro: ReminderMiembro;
  tipo: ReminderType;
};

// Clave de dedup: un (miembro, tipo, vencimiento) solo se envía una vez. Al
// renovar cambia la fechaVencimiento, lo que habilita un nuevo ciclo de avisos.
function dedupKey(miembroId: string, tipo: ReminderType, due: Date): string {
  return `${miembroId}|${tipo}|${due.toISOString().slice(0, 10)}`;
}

export function dueRemindersForToday(
  miembros: ReminderMiembro[],
  alreadySent: SentReminder[],
  today: Date = new Date(),
): DueReminder[] {
  const sentKeys = new Set(
    alreadySent.map((s) => dedupKey(s.miembroId, s.tipo, s.fechaVencimiento)),
  );

  const result: DueReminder[] = [];
  for (const miembro of miembros) {
    const tipo = reminderTypeForDueDate(miembro.fechaVencimiento, today);
    if (!tipo) continue;
    if (sentKeys.has(dedupKey(miembro.id, tipo, miembro.fechaVencimiento))) {
      continue;
    }
    result.push({ miembro, tipo });
  }
  return result;
}
