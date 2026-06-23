"use client";

import { useMemo, useState, useTransition } from "react";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  registerPayment,
  type PaymentActionState,
} from "@/app/(app)/actions/payments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcDueDate } from "@/lib/membership";
import { formatDate } from "@/lib/status-meta";
import { todayISO } from "@/lib/utils";

const initialState: PaymentActionState = { ok: false };

export function PaymentDialog({
  miembroId,
  miembroNombre,
  trigger,
}: {
  miembroId: string;
  miembroNombre: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [fechaPago, setFechaPago] = useState(todayISO());
  const [pending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    startTransition(async () => {
      const result = await registerPayment(initialState, formData);
      if (result.ok) {
        toast.success("Pago registrado");
        setOpen(false);
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setFechaPago(todayISO());
  }

  const nuevoVencimiento = useMemo(() => {
    if (!fechaPago) return null;
    const due = calcDueDate(new Date(`${fechaPago}T12:00:00Z`));
    return formatDate(due.toISOString().slice(0, 10));
  }, [fechaPago]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <p className="font-mono text-[11px] font-semibold tracking-[0.15em] text-primary">
            REGISTRO DE PAGO
          </p>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Nuevo pago para {miembroNombre}. El vencimiento se recalcula a un
            mes desde la fecha del pago.
          </DialogDescription>
        </DialogHeader>

        <form
          id="payment-form"
          action={handleAction}
          className="flex flex-col gap-4 px-7 pb-4"
        >
          <input type="hidden" name="miembroId" defaultValue={miembroId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fechaPago">Fecha de pago</Label>
            <div className="relative">
              <Input
                id="fechaPago"
                name="fechaPago"
                type="date"
                required
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="pr-9 font-mono [&::-webkit-calendar-picker-indicator]:opacity-0"
              />
              <Calendar
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="monto">Monto (opcional)</Label>
            <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-card px-3 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50">
              <span className="font-mono text-sm text-muted-subtle">COP</span>
              <input
                id="monto"
                name="monto"
                type="number"
                min="0"
                step="0.01"
                placeholder="80.000"
                className="w-full bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-subtle [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>

          {nuevoVencimiento && (
            <div className="flex flex-col gap-2 rounded-[10px] bg-background p-4">
              <p className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground">
                NUEVO VENCIMIENTO
              </p>
              <p className="font-heading text-xl font-bold text-foreground">
                {nuevoVencimiento}
              </p>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" form="payment-form" disabled={pending}>
            {pending ? "Guardando..." : "Registrar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
