import { describe, it, expect } from "vitest";
import { calcDueDate } from "./membership";

describe("calcDueDate", () => {
  it("suma un mes a la fecha de pago", () => {
    expect(calcDueDate(new Date("2026-01-15"))).toEqual(new Date("2026-02-15"));
  });
  it("maneja fin de mes (31 ene -> 28 feb)", () => {
    expect(calcDueDate(new Date("2026-01-31"))).toEqual(new Date("2026-02-28"));
  });
});
