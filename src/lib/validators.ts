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
