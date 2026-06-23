import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-5xl font-semibold tracking-tight text-zinc-900">404</p>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Página no encontrada
          </h1>
          <p className="text-sm text-zinc-500">
            La página que buscas no existe o fue movida.
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="size-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </main>
  );
}
