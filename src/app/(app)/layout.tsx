import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/logo";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const adminName = session.user.name ?? session.user.email ?? "";

  return (
    <div className="flex min-h-full flex-col bg-background">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background"
      >
        Saltar al contenido
      </a>
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-4 sm:px-12">
        <Logo />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background"
              aria-hidden="true"
            >
              {adminName.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden text-sm font-medium text-foreground sm:inline">
              {adminName}
            </span>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs">
              <LogOut className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </form>
        </div>
      </header>

      <main
        id="contenido"
        className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-12 sm:py-8"
      >
        {children}
      </main>

      <Toaster />
    </div>
  );
}
