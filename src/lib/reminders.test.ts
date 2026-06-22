import { describe, it, expect } from "vitest";
import { dueRemindersForToday } from "./reminders";

describe("dueRemindersForToday", () => {
  const today = new Date("2026-06-17");
  const m = {
    id: "1",
    correo: "a@x.com",
    nombre: "Ana",
    fechaVencimiento: new Date("2026-06-24"),
  };

  it("incluye 7d cuando corresponde y no fue enviado", () => {
    expect(dueRemindersForToday([m], [], today)).toEqual([
      { miembro: m, tipo: "7d" },
    ]);
  });

  it("excluye si ya se envió ese tipo para ese vencimiento", () => {
    const sent = [
      { miembroId: "1", tipo: "7d" as const, fechaVencimiento: new Date("2026-06-24") },
    ];
    expect(dueRemindersForToday([m], sent, today)).toEqual([]);
  });

  it("no incluye miembros que no están en día de recordatorio", () => {
    const otro = { ...m, fechaVencimiento: new Date("2026-06-19") };
    expect(dueRemindersForToday([otro], [], today)).toEqual([]);
  });

  it("permite un nuevo aviso si cambió la fecha de vencimiento (renovación)", () => {
    const sent = [
      { miembroId: "1", tipo: "7d" as const, fechaVencimiento: new Date("2026-05-24") },
    ];
    expect(dueRemindersForToday([m], sent, today)).toEqual([
      { miembro: m, tipo: "7d" },
    ]);
  });
});
