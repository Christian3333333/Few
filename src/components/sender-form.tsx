"use client";

import { useActionState, useState } from "react";
import { guardarRemitente } from "@/app/acciones";
import { ErrorNote, PrimaryButton, TextField } from "@/components/ui";

export function SenderForm({ quoteId }: { quoteId: string }) {
  const action = guardarRemitente.bind(null, quoteId);
  const [state, formAction, pending] = useActionState(action, null);
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [celular, setCelular] = useState("");
  return (
    <form action={formAction} className="flex flex-1 flex-col gap-4">
      <TextField label="Nombre" name="nombre" placeholder="María Quispe" autoComplete="name" value={nombre} onChange={setNombre} />
      <TextField label="DNI" name="dni" placeholder="12345678" inputMode="numeric" autoComplete="off" value={dni} onChange={setDni} />
      <TextField label="Celular" name="celular" placeholder="999 888 777" inputMode="numeric" autoComplete="tel" value={celular} onChange={setCelular} />
      {state?.error ? <ErrorNote>{state.error}</ErrorNote> : null}
      <div className="mt-auto">
        <PrimaryButton disabled={pending}>{pending ? "Guardando…" : "Continuar"}</PrimaryButton>
      </div>
    </form>
  );
}
