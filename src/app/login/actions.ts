"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string; email?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    // Auth.js lanza un AuthError cuando las credenciales son inválidas;
    // cualquier otro throw (p.ej. NEXT_REDIRECT del login correcto) se re-lanza.
    if (error instanceof AuthError) {
      return { error: "Correo o contraseña incorrectos.", email };
    }
    throw error;
  }

  return {};
}
