import { z } from "zod";

// Zod v4: `z.email()` reemplaza al deprecado `z.string().email()`.
export const memberSchema = z.object({
  nombre: z.string().min(1, "Nombre obligatorio"),
  correo: z.email("Correo inválido"),
  telefono: z.string().optional().or(z.literal("")),
  documento: z.string().optional().or(z.literal("")),
  contactoEmergencia: z.string().optional().or(z.literal("")),
  fechaNacimiento: z.string().optional().or(z.literal("")),
});

export type MemberInput = z.infer<typeof memberSchema>;

export const paymentSchema = z.object({
  fechaPago: z.string().min(1, "Fecha de pago obligatoria"),
  monto: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      "Monto inválido",
    ),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
