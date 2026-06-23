"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createMember,
  updateMember,
  type MemberActionState,
  type MemberRow,
} from "@/app/(app)/actions/members";
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
import { todayISO } from "@/lib/utils";

const initialState: MemberActionState = { ok: false };

export function MemberForm({
  member,
  trigger,
}: {
  member?: MemberRow;
  trigger: React.ReactNode;
}) {
  const isEdit = Boolean(member);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleAction(formData: FormData) {
    const action = isEdit ? updateMember : createMember;
    startTransition(async () => {
      const result = await action(initialState, formData);
      if (result.ok) {
        toast.success(isEdit ? "Persona actualizada" : "Persona creada");
        setOpen(false);
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <p className="font-mono text-[11px] font-semibold tracking-[0.15em] text-primary">
            {isEdit ? "EDITAR PERSONA" : "NUEVA PERSONA"}
          </p>
          <DialogTitle>
            {isEdit ? "Editar persona" : "Registrar persona"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos y la suscripción."
              : "Añade una nueva persona al gimnasio. Los campos marcados con * son obligatorios."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="member-form"
          action={handleAction}
          className="flex flex-col gap-4 px-7 pb-4"
        >
          {isEdit && <input type="hidden" name="id" defaultValue={member!.id} />}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              name="nombre"
              required
              placeholder="Nombre completo"
              defaultValue={member?.nombre}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="correo">Correo *</Label>
            <Input
              id="correo"
              name="correo"
              type="email"
              required
              placeholder="ejemplo@correo.com"
              defaultValue={member?.correo}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                placeholder="+57 300 000 0000"
                defaultValue={member?.telefono ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="documento">Documento</Label>
              <Input
                id="documento"
                name="documento"
                placeholder="1.000.000.000"
                defaultValue={member?.documento ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactoEmergencia">Contacto de emergencia</Label>
              <Input
                id="contactoEmergencia"
                name="contactoEmergencia"
                placeholder="Nombre y teléfono"
                defaultValue={member?.contactoEmergencia ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
              <Input
                id="fechaNacimiento"
                name="fechaNacimiento"
                type="date"
                defaultValue={member?.fechaNacimiento ?? ""}
              />
            </div>
          </div>

          {isEdit ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fechaInicio">Inicio</Label>
                <Input
                  id="fechaInicio"
                  name="fechaInicio"
                  type="date"
                  required
                  defaultValue={member?.fechaInicio}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fechaVencimiento">Vencimiento</Label>
                <Input
                  id="fechaVencimiento"
                  name="fechaVencimiento"
                  type="date"
                  required
                  defaultValue={member?.fechaVencimiento}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fechaPago">Fecha de pago *</Label>
                <Input
                  id="fechaPago"
                  name="fechaPago"
                  type="date"
                  required
                  defaultValue={todayISO()}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="monto">Monto</Label>
                <Input
                  id="monto"
                  name="monto"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Opcional"
                />
              </div>
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
          <Button type="submit" form="member-form" disabled={pending}>
            {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar persona"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
