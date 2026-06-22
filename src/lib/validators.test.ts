import { describe, it, expect } from "vitest";
import { memberSchema } from "./validators";

describe("memberSchema", () => {
  it("rechaza correo inválido", () => {
    expect(
      memberSchema.safeParse({ nombre: "Ana", correo: "no-mail" }).success,
    ).toBe(false);
  });

  it("rechaza nombre vacío", () => {
    expect(
      memberSchema.safeParse({ nombre: "", correo: "ana@x.com" }).success,
    ).toBe(false);
  });

  it("acepta mínimos obligatorios", () => {
    expect(
      memberSchema.safeParse({ nombre: "Ana", correo: "ana@x.com" }).success,
    ).toBe(true);
  });

  it("acepta campos opcionales vacíos o ausentes", () => {
    expect(
      memberSchema.safeParse({
        nombre: "Ana",
        correo: "ana@x.com",
        telefono: "",
        documento: "",
        contactoEmergencia: "",
        fechaNacimiento: "",
      }).success,
    ).toBe(true);
  });
});
