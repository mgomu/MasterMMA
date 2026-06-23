import type { MemberRow } from "@/app/(app)/actions/members";
import type { MembershipStatus } from "@/lib/membership";
import { Card, CardContent } from "@/components/ui/card";

const COUNTERS: {
  status: MembershipStatus;
  label: string;
  className: string;
}[] = [
  { status: "activo", label: "Activos", className: "text-green-800" },
  { status: "por_vencer", label: "Por vencer", className: "text-amber-800" },
  { status: "vencido", label: "Vencidos", className: "text-red-800" },
];

export function StatusCounters({ members }: { members: MemberRow[] }) {
  const totals: Record<MembershipStatus, number> = {
    activo: 0,
    por_vencer: 0,
    vencido: 0,
  };
  for (const m of members) totals[m.estado] += 1;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COUNTERS.map((c) => (
        <Card key={c.status}>
          <CardContent>
            <p className="text-sm text-zinc-500">{c.label}</p>
            <p className={`text-3xl font-semibold ${c.className}`}>
              {totals[c.status]}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
