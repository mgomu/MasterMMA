"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { MemberRow } from "@/app/(app)/actions/members";
import type { MembershipStatus } from "@/lib/membership";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberForm } from "@/components/member-form";
import { DeleteMemberDialog } from "@/components/delete-member-dialog";

const STATUS_META: Record<
  MembershipStatus,
  { label: string; className: string }
> = {
  activo: {
    label: "Activo",
    className: "bg-green-100 text-green-700",
  },
  por_vencer: {
    label: "Por vencer",
    className: "bg-amber-100 text-amber-700",
  },
  vencido: {
    label: "Vencido",
    className: "bg-red-100 text-red-700",
  },
};

function formatDate(iso: string): string {
  // `iso` viene como `YYYY-MM-DD`; lo mostramos como `DD/MM/YYYY` sin tocar zona.
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function MemberTable({ members }: { members: MemberRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.nombre.toLowerCase().includes(q) ||
        m.correo.toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar por nombre o correo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <MemberForm trigger={<Button>Nueva persona</Button>} />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-500">
                  {members.length === 0
                    ? "Aún no hay personas registradas."
                    : "Sin resultados para la búsqueda."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => {
                const meta = STATUS_META[m.estado];
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nombre}</TableCell>
                    <TableCell className="text-zinc-600">{m.correo}</TableCell>
                    <TableCell>{formatDate(m.fechaVencimiento)}</TableCell>
                    <TableCell>
                      <Badge className={meta.className}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <MemberForm
                          member={m}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label="Editar">
                              <Pencil />
                            </Button>
                          }
                        />
                        <DeleteMemberDialog
                          member={m}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Eliminar"
                            >
                              <Trash2 />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
