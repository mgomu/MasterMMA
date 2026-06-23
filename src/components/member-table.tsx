"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Pencil,
  Trash2,
  Check,
  Clock3,
  Plus,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import type { MemberRow } from "@/app/(app)/actions/members";
import type { MembershipStatus } from "@/lib/membership";
import { STATUS_META, formatDate } from "@/lib/status-meta";
import { STATUS_FILTER_LABELS } from "@/components/status-counters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PaymentDialog } from "@/components/payment-dialog";

const STATUS_ICONS = {
  check: Check,
  clock: Clock3,
  alert: TriangleAlert,
} as const;

const PAGE_SIZE = 10;

function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function MemberTable({
  members,
  statusFilter,
  onClearStatusFilter,
}: {
  members: MemberRow[];
  statusFilter: MembershipStatus | null;
  onClearStatusFilter: () => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [prevStatusFilter, setPrevStatusFilter] = useState(statusFilter);

  if (statusFilter !== prevStatusFilter) {
    setPrevStatusFilter(statusFilter);
    setPage(0);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (statusFilter && m.estado !== statusFilter) return false;
      if (!q) return true;
      return (
        m.nombre.toLowerCase().includes(q) || m.correo.toLowerCase().includes(q)
      );
    });
  }, [members, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );

  function updateQuery(value: string) {
    setQuery(value);
    setPage(0);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Label htmlFor="buscar" className="sr-only">
            Buscar por nombre o correo
          </Label>
          <div className="relative w-full max-w-80 min-w-0">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-subtle"
              aria-hidden="true"
            />
            <Input
              id="buscar"
              placeholder="Buscar por nombre o correo..."
              value={query}
              onChange={(e) => updateQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {statusFilter && (
            <Badge
              className={`w-fit ${STATUS_META[statusFilter].className}`}
            >
              Filtrando por: {STATUS_FILTER_LABELS[statusFilter]}
              <button
                type="button"
                onClick={onClearStatusFilter}
                aria-label="Quitar filtro"
                className="-mr-1 ml-0.5 rounded-full p-0.5 hover:bg-black/10"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
        </div>
        <MemberForm
          trigger={
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Nueva persona
            </Button>
          }
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="min-w-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="md:w-[280px]">Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Correo</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="w-[1px] whitespace-nowrap">Estado</TableHead>
                <TableHead className="hidden text-right md:table-cell">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    {members.length === 0
                      ? "Aún no hay personas registradas."
                      : statusFilter
                        ? `No hay personas con estado "${STATUS_FILTER_LABELS[statusFilter]}".`
                        : "Sin resultados para la búsqueda."}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((m) => {
                  const meta = STATUS_META[m.estado];
                  const Icon = STATUS_ICONS[meta.icon];
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/miembros/${m.id}`}
                          className="flex min-w-0 items-center gap-2.5 hover:underline"
                        >
                          <span
                            className="hidden md:flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background"
                            aria-hidden="true"
                          >
                            {initials(m.nombre)}
                          </span>
                          <span className="min-w-0 truncate font-semibold text-foreground">
                            {m.nombre}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {m.correo}
                      </TableCell>
                      <TableCell className="font-mono text-foreground">
                        {formatDate(m.fechaVencimiento)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`w-full justify-center md:w-[140px] ${meta.className}`}
                        >
                          <Icon className="size-3" aria-hidden="true" />
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex justify-end gap-1">
                          <PaymentDialog
                            miembroId={m.id}
                            miembroNombre={m.nombre}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Registrar pago"
                              >
                                <DollarSign className="text-muted-foreground" />
                              </Button>
                            }
                          />
                          <MemberForm
                            member={m}
                            trigger={
                              <Button variant="ghost" size="icon" aria-label="Editar">
                                <Pencil className="text-muted-foreground" />
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
                                <Trash2 className="text-primary" />
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

      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {paged.length} de {filtered.length} personas
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
