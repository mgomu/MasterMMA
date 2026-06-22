import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, DollarSign } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { miembros, pagos } from "@/db/schema";
import { membershipStatus } from "@/lib/membership";
import { STATUS_META, formatDate } from "@/lib/status-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentDialog } from "@/components/payment-dialog";

function formatMonto(monto: string | null): string {
  if (!monto) return "—";
  const n = Number(monto);
  if (Number.isNaN(n)) return monto;
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP" });
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

  const estado = membershipStatus(
    new Date(`${miembro.fechaVencimiento}T12:00:00Z`),
  );
  const meta = STATUS_META[estado];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:underline"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {miembro.nombre}
          </h1>
          <Badge className={meta.className}>{meta.label}</Badge>
        </div>
        <PaymentDialog
          miembroId={miembro.id}
          miembroNombre={miembro.nombre}
          trigger={
            <Button>
              <DollarSign className="size-4" />
              Registrar pago
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            <Field label="Correo" value={miembro.correo} />
            <Field label="Teléfono" value={miembro.telefono} />
            <Field label="Documento" value={miembro.documento} />
            <Field
              label="Contacto de emergencia"
              value={miembro.contactoEmergencia}
            />
            <Field
              label="Fecha de nacimiento"
              value={miembro.fechaNacimiento ? formatDate(miembro.fechaNacimiento) : null}
            />
            <Field label="Inicio" value={formatDate(miembro.fechaInicio)} />
            <Field
              label="Vencimiento"
              value={formatDate(miembro.fechaVencimiento)}
            />
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
          Historial de pagos
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha de pago</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historial.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-zinc-500">
                    Aún no hay pagos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                historial.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.fechaPago)}</TableCell>
                    <TableCell className="text-right">
                      {formatMonto(p.monto)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="text-sm text-zinc-900">{value ?? "—"}</dd>
    </div>
  );
}
