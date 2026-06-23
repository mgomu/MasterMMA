import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-background p-8">
      <div className="flex w-full max-w-[400px] flex-col gap-8 rounded-2xl border border-border bg-card p-10">
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-[11px] font-semibold tracking-[0.15em] text-primary">
            ACCESO DE ADMINISTRADORES
          </p>
          <h1 className="font-heading text-[28px] font-bold tracking-tight text-foreground">
            Iniciar sesión
          </h1>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-muted-foreground">
          ¿Problemas para entrar? Contacta al administrador principal.
        </p>
      </div>
    </main>
  );
}
