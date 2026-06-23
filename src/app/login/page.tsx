import { LoginForm } from "./login-form";

const STATS = [
  { value: "+1.200", label: "miembros gestionados" },
  { value: "99.9%", label: "tiempo de actividad" },
  { value: "0", label: "recordatorios olvidados" },
];

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-1">
      <section className="hidden w-[42%] max-w-[760px] shrink-0 flex-col justify-between bg-[#0F0F0F] p-16 lg:flex">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-2.5">
            <span className="size-8 rounded-md bg-primary" aria-hidden="true" />
            <span className="font-heading text-base font-bold tracking-tight text-white">
              GIMNASIO MMA
            </span>
          </div>
          <h1 className="font-heading text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] font-extrabold tracking-tighter text-balance text-white">
            Control total de tus miembros.
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-[#B8B8B8]">
            Administra pagos, vencimientos y recordatorios automáticos desde
            un solo lugar. Más minutos entrenando, menos en planillas.
          </p>
        </div>

        <div className="flex items-end gap-12">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <p className="font-heading text-4xl font-extrabold tracking-tight text-primary">
                {s.value}
              </p>
              <p className="text-sm text-[#9A9A9A]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center bg-background p-8 sm:p-16">
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
      </section>
    </main>
  );
}
