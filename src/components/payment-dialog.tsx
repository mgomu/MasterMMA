"use client";

import { useActionState, useEffect, useState } from "react";
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

const initialState: PaymentActionState = { ok: false };

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

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
  const [state, formAction, pending] = useActionState(
    registerPayment,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Pago registrado");
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Nuevo pago para {miembroNombre}. El vencimiento se recalcula a un mes
            desde la fecha del pago.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="miembroId" defaultValue={miembroId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fechaPago">Fecha de pago</Label>
            <Input
              id="fechaPago"
              name="fechaPago"
              type="date"
              required
              defaultValue={todayISO()}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="monto">Monto (opcional)</Label>
            <Input
              id="monto"
              name="monto"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
