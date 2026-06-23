import { describe, it, expect, vi, afterEach } from "vitest";
import { todayISO } from "./utils";

// Regression: ISSUE-001 — todayISO() usaba UTC, desfase de un día en horario local
// Found by /qa on 2026-06-22
// Report: .gstack/qa-reports/qa-report-localhost-3000-2026-06-22.md

describe("todayISO", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("devuelve la fecha local, no UTC", () => {
    // 22 jun 2026 a las 23:00 hora local Colombia (UTC-5)
    // En UTC ya es 23 jun 00:00 → toISOString daría 2026-06-23
    // La fecha local correcta es 2026-06-22
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T23:00:00-05:00"));

    expect(todayISO()).toBe("2026-06-22");
  });

  it("coincide con UTC en la mañana local", () => {
    // 22 jun 2026 a las 10:00 hora local (UTC-5) → UTC 15:00, mismo día
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T10:00:00-05:00"));

    expect(todayISO()).toBe("2026-06-22");
  });

  it("formato YYYY-MM-DD", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T03:00:00-05:00"));

    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
