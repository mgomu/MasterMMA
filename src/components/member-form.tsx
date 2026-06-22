"use client";

import { useActionState, useEffect, useState } from "react";
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
  const [state, formAction, pending] = useActionState(
    isEdit ? updateMember : createMember,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(isEdit ? "Persona actualizada" : "Persona creada");
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, isEdit]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar persona" : "Nueva persona"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos y la suscripción."
              : "Registra una nueva persona en el gimnasio."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" defaultValue={member!.id} />}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" name="nombre" required defaultValue={member?.nombre} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="correo">Correo *</Label>
            <Input
              id="correo"
              name="correo"
              type="email"
              required
              defaultValue={member?.correo}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" defaultValue={member?.telefono ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="documento">Documento</Label>
              <Input
                id="documento"
                name="documento"
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

          {isEdit && (
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
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
