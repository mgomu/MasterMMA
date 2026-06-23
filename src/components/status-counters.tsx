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
  selectedRingClass: string;
  hoverRingClass: string;
}[] = [
  {
    status: "activo",
    label: "Activos",
    icon: Check,
    chipBg: "bg-green-100",
    valueClass: "text-green-800",
    selectedRingClass: "ring-2 ring-green-600",
    hoverRingClass: "hover:ring-2 hover:ring-green-600",
  },
  {
    status: "por_vencer",
    label: "Por vencer",
    icon: Clock3,
    chipBg: "bg-amber-100",
    valueClass: "text-amber-800",
    selectedRingClass: "ring-2 ring-amber-600",
    hoverRingClass: "hover:ring-2 hover:ring-amber-600",
  },
  {
    status: "vencido",
    label: "Vencidos",
    icon: TriangleAlert,
    chipBg: "bg-red-100",
    valueClass: "text-red-800",
    selectedRingClass: "ring-2 ring-red-600",
    hoverRingClass: "hover:ring-2 hover:ring-red-600",
  },
];

export const STATUS_FILTER_LABELS: Record<MembershipStatus, string> =
  Object.fromEntries(COUNTERS.map((c) => [c.status, c.label])) as Record<
    MembershipStatus,
    string
  >;

export function StatusCounters({
  members,
  selected,
  onSelect,
}: {
  members: MemberRow[];
  selected: MembershipStatus | null;
  onSelect: (status: MembershipStatus) => void;
}) {
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
        const isSelected = selected === c.status;
        return (
          <Card
            key={c.status}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`Filtrar por ${c.label.toLowerCase()}`}
            onClick={() => onSelect(c.status)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(c.status);
              }
            }}
            className={`cursor-pointer outline-none transition-all [--card-spacing:12px] focus-visible:ring-2 sm:[--card-spacing:24px] ${
              isSelected ? c.selectedRingClass : c.hoverRingClass
            }`}
          >
            <CardContent className="flex flex-col gap-1 sm:gap-3">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[11px] leading-tight font-medium text-muted-foreground sm:text-sm">
                  {c.label}
                </p>
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full sm:size-8 ${c.chipBg}`}
                  aria-hidden="true"
                >
                  <Icon className={`size-2.5 sm:size-4 ${c.valueClass}`} />
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
