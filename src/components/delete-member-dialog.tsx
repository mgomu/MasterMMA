"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteMember, type MemberRow } from "@/app/(app)/actions/members";
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

export function DeleteMemberDialog({
  member,
  trigger,
}: {
  member: MemberRow;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMember(member.id);
      if (result.ok) {
        toast.success("Persona eliminada");
        setOpen(false);
      } else {
        toast.error(result.error ?? "No se pudo eliminar.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar persona</DialogTitle>
          <DialogDescription>
            ¿Seguro que quieres eliminar a {member.nombre}? Esta acción no se
            puede deshacer y borra también su historial de pagos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
