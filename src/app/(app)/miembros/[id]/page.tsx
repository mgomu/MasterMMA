import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  DollarSign,
  Check,
  Clock3,
  TriangleAlert,
} from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { subDays } from "date-fns";
import { db } from "@/db";
import { miembros, pagos, recordatoriosEnviados } from "@/db/schema";
import { membershipStatus, type ReminderType } from "@/lib/membership";
import { STATUS_META, formatDate } from "@/lib/status-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentDialog } from "@/components/payment-dialog";

const STATUS_ICONS = {
  check: Check,
  clock: Clock3,
  alert: TriangleAlert,
} as const;

const REMINDER_STEPS: { tipo: ReminderType; dias: number; label: string }[] = [
  { tipo: "7d", dias: 7, label: "T-7 días" },
  { tipo: "3d", dias: 3, label: "T-3 días" },
  { tipo: "1d", dias: 1, label: "T-1 día" },
];

function formatMonto(monto: string | null): string {
  if (!monto) return "—";
  const n = Number(monto);
  if (Number.isNaN(n)) return monto;
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [miembro] = await db
    .select()
    .from(miembros)
    .where(eq(miembros.id, id))
    .limit(1);

  if (!miembro) notFound();

  const historial = await db
    .select()
    .from(pagos)
    .where(eq(pagos.miembroId, id))
    .orderBy(desc(pagos.fechaPago));

  const enviados = await db
    .select()
    .from(recordatoriosEnviados)
    .where(eq(recordatoriosEnviados.miembroId, id));

  const today = new Date();
  const dueDate = new Date(`${miembro.fechaVencimiento}T12:00:00Z`);
  const estado = membershipStatus(dueDate, today);
  const meta = STATUS_META[estado];
  const Icon = STATUS_ICONS[meta.icon];

  const sentTypes = new Set(
    enviados
      .filter((r) => r.fechaVencimiento === miembro.fechaVencimiento)
      .map((r) => r.tipo),
  );

  const reminders = REMINDER_STEPS.map((step) => ({
    ...step,
    fecha: subDays(dueDate, step.dias),
    enviado: sentTypes.has(step.tipo),
  }));
  const todayMidnight = new Date(today);
  todayMidnight.setUTCHours(0, 0, 0, 0);
  const nextIndex = reminders.findIndex(
    (r) => !r.enviado && r.fecha.getTime() >= todayMidnight.getTime(),
  );

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-5">
          <span
            className="flex size-24 shrink-0 items-center justify-center rounded-full bg-foreground font-heading text-3xl font-bold text-background"
            aria-hidden="true"
          >
            {initials(miembro.nombre)}
          </span>
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
              {miembro.nombre}
            </h1>
            <Badge className={meta.className}>
              <Icon className="size-3" aria-hidden="true" />
              {meta.label}
            </Badge>
          </div>
        </div>
        <PaymentDialog
          miembroId={miembro.id}
          miembroNombre={miembro.nombre}
          trigger={
            <Button size="lg">
              <DollarSign className="size-4" aria-hidden="true" />
              Registrar pago
            </Button>
          }
        />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="w-full lg:max-w-[520px] lg:shrink-0 [--card-spacing:28px]">
          <CardContent className="flex flex-col gap-6">
            <h2 className="font-heading text-lg font-bold text-foreground">
              Datos
            </h2>
            <dl className="flex flex-col gap-5">
              <Field label="Correo" value={miembro.correo} />
              <Field label="Teléfono" value={miembro.telefono} />
              <Field label="Documento" value={miembro.documento} />
              <Field
                label="Contacto de emergencia"
                value={miembro.contactoEmergencia}
              />
              <Field
                label="Fecha de nacimiento"
                value={
                  miembro.fechaNacimiento
                    ? formatDate(miembro.fechaNacimiento)
                    : null
                }
              />
              <Field label="Inicio" value={formatDate(miembro.fechaInicio)} />
              <Field
                label="Vencimiento"
                value={formatDate(miembro.fechaVencimiento)}
              />
            </dl>
          </CardContent>
        </Card>

        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-xl bg-foreground p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-white">
                Próximos recordatorios
              </h2>
              <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">
                Automático
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {reminders.map((r, i) => (
                <div
                  key={r.tipo}
                  className="flex items-center justify-between rounded-[10px] bg-[#1A1A1A] px-[18px] py-3.5"
                >
                  <span
                    className={`font-mono text-[13px] font-semibold ${
                      i === nextIndex ? "text-white" : "text-[#B8B8B8]"
                    }`}
                  >
                    {r.label}
                  </span>
                  <span className="text-[13px] text-[#9A9A9A]">
                    {formatDate(r.fecha.toISOString().slice(0, 10))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Card className="[--card-spacing:28px]">
            <CardContent className="flex flex-col gap-4">
              <h2 className="font-heading text-lg font-bold text-foreground">
                Historial de pagos
              </h2>
              <div className="overflow-hidden rounded-lg border border-border-subtle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-muted text-xs">
                        Fecha de pago
                      </TableHead>
                      <TableHead className="bg-muted text-right text-xs">
                        Monto
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historial.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-center text-muted-foreground"
                        >
                          Aún no hay pagos registrados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      historial.map((p) => (
                        <TableRow
                          key={p.id}
                          className="border-border-subtle"
                        >
                          <TableCell className="font-mono">
                            {formatDate(p.fechaPago)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {formatMonto(p.monto)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-medium tracking-wide text-muted-subtle uppercase">
        {label}
      </dt>
      <dd className="text-[15px] text-foreground">{value ?? "—"}</dd>
    </div>
  );
}
