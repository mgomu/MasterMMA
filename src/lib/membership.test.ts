import { describe, it, expect } from "vitest";
import {
  calcDueDate,
  membershipStatus,
  reminderTypeForDueDate,
} from "./membership";

describe("calcDueDate", () => {
  it("suma un mes a la fecha de pago", () => {
    expect(calcDueDate(new Date("2026-01-15"))).toEqual(new Date("2026-02-15"));
  });
  it("maneja fin de mes (31 ene -> 28 feb)", () => {
    expect(calcDueDate(new Date("2026-01-31"))).toEqual(new Date("2026-02-28"));
  });
});

describe("membershipStatus", () => {
  const today = new Date("2026-06-17");
  it("vencido cuando la fecha pasó", () => {
    expect(membershipStatus(new Date("2026-06-16"), today)).toBe("vencido");
  });
  it("por vencer dentro de 7 días (incluye hoy y día 7)", () => {
    expect(membershipStatus(new Date("2026-06-17"), today)).toBe("por_vencer");
    expect(membershipStatus(new Date("2026-06-24"), today)).toBe("por_vencer");
  });
  it("activo a más de 7 días", () => {
    expect(membershipStatus(new Date("2026-06-25"), today)).toBe("activo");
  });
});

describe("reminderTypeForDueDate", () => {
  const today = new Date("2026-06-17");
  it("7d cuando vence en 7 días", () => {
    expect(reminderTypeForDueDate(new Date("2026-06-24"), today)).toBe("7d");
  });
  it("3d / 1d", () => {
    expect(reminderTypeForDueDate(new Date("2026-06-20"), today)).toBe("3d");
    expect(reminderTypeForDueDate(new Date("2026-06-18"), today)).toBe("1d");
  });
  it("null si no es día de recordatorio", () => {
    expect(reminderTypeForDueDate(new Date("2026-06-19"), today)).toBeNull();
  });
});
