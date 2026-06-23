import { Check, Clock3, TriangleAlert } from "lucide-react";
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
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {COUNTERS.map((c) => {
        const Icon = c.icon;
        return (
          <Card
            key={c.status}
            className="[--card-spacing:12px] sm:[--card-spacing:24px]"
          >
            <CardContent className="flex flex-col gap-1 sm:gap-3">
              <div className="flex items-center justify-between gap-1">
                <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                  {c.label}
                </p>
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full sm:size-8 ${c.chipBg}`}
                  aria-hidden="true"
                >
                  <Icon className={`size-3 sm:size-4 ${c.valueClass}`} />
                </span>
              </div>
              <p
                className={`font-mono text-2xl font-bold tracking-tight sm:text-5xl ${c.valueClass}`}
              >
                {totals[c.status]}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
