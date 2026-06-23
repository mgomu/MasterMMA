import type { MembershipStatus } from "@/lib/membership";

/** Etiqueta, clases de color e ícono del badge por estado de membresía. */
export const STATUS_META: Record<
  MembershipStatus,
  { label: string; className: string; icon: "check" | "clock" | "alert" }
> = {
  activo: {
    label: "Activo",
    className: "bg-green-100 text-green-800",
    icon: "check",
  },
  por_vencer: {
    label: "Por vencer",
    className: "bg-amber-100 text-amber-800",
    icon: "clock",
  },
  vencido: {
    label: "Vencido",
    className: "bg-red-100 text-red-800",
    icon: "alert",
  },
};

/** `YYYY-MM-DD` -> `DD/MM/YYYY` sin tocar la zona horaria. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
