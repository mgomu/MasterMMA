import type { MembershipStatus } from "@/lib/membership";

/** Etiqueta y clases de color del badge por estado de membresía. */
export const STATUS_META: Record<
  MembershipStatus,
  { label: string; className: string }
> = {
  activo: { label: "Activo", className: "bg-green-100 text-green-700" },
  por_vencer: { label: "Por vencer", className: "bg-amber-100 text-amber-700" },
  vencido: { label: "Vencido", className: "bg-red-100 text-red-700" },
};

/** `YYYY-MM-DD` -> `DD/MM/YYYY` sin tocar la zona horaria. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
