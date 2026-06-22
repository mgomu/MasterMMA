import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Gimnasio MMA
          </h1>
          <p className="text-sm text-zinc-500">Acceso de administradores</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
