import { desc } from "drizzle-orm";
import { db } from "@/db";
import { miembros } from "@/db/schema";
import { membershipStatus } from "@/lib/membership";
import type { MemberRow } from "@/app/(app)/actions/members";
import { MembersDashboard } from "@/components/members-dashboard";

export default async function DashboardPage() {
  const rows = await db
    .select()
    .from(miembros)
    .orderBy(desc(miembros.creadoEn));

  const today = new Date();
  const members: MemberRow[] = rows.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    correo: m.correo,
    telefono: m.telefono,
    documento: m.documento,
    contactoEmergencia: m.contactoEmergencia,
    fechaNacimiento: m.fechaNacimiento,
    fechaInicio: m.fechaInicio,
    fechaVencimiento: m.fechaVencimiento,
    // El vencimiento es un `date` puro; lo parseamos como mediodía UTC para que
    // la comparación de días de calendario no se desfase por zona horaria.
    estado: membershipStatus(new Date(`${m.fechaVencimiento}T12:00:00Z`), today),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[11px] font-semibold tracking-[0.15em] text-primary">
          MEMBRESÍAS
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
          Personas
        </h1>
      </div>
      <MembersDashboard members={members} />
    </div>
  );
}
