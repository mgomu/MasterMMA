import { Check, Clock3, TrendingUp, TriangleAlert } from "lucide-react";
import type { MemberRow } from "@/app/(app)/actions/members";
import type { MembershipStatus } from "@/lib/membership";
import { Card, CardContent } from "@/components/ui/card";

const COUNTERS: {
  status: MembershipStatus;
  label: string;
  icon: typeof Check;
  chipBg: string;
  valueClass: string;
}[] = [
  {
    status: "activo",
    label: "Activos",
    icon: Check,
    chipBg: "bg-green-100",
    valueClass: "text-green-800",
  },
  {
    status: "por_vencer",
    label: "Por vencer",
    icon: Clock3,
    chipBg: "bg-amber-100",
    valueClass: "text-amber-800",
  },
  {
    status: "vencido",
    label: "Vencidos",
    icon: TriangleAlert,
    chipBg: "bg-red-100",
    valueClass: "text-red-800",
  },
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
      {COUNTERS.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.status} className="[--card-spacing:24px]">
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {c.label}
                </p>
                <span
                  className={`flex size-8 items-center justify-center rounded-full ${c.chipBg}`}
                  aria-hidden="true"
                >
                  <Icon className={`size-4 ${c.valueClass}`} />
                </span>
              </div>
              <p
                className={`font-mono text-5xl font-bold tracking-tight ${c.valueClass}`}
              >
                {totals[c.status]}
              </p>
              <div className="flex items-center gap-1.5">
                <TrendingUp
                  className={`size-3 ${c.valueClass}`}
                  aria-hidden="true"
                />
                <span className="text-xs text-muted-foreground">
                  vs. mes anterior
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
