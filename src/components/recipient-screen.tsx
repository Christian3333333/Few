"use client";

import { useActionState, useState } from "react";
import { crearDestinatario, elegirDestinatario } from "@/app/acciones";
import type { Recipient } from "@/domain/store";
import { ErrorNote, PrimaryButton, TextField } from "@/components/ui";

export function RecipientScreen({ quoteId, recipients }: { quoteId: string; recipients: Recipient[] }) {
  const [creating, setCreating] = useState(recipients.length === 0);
  const choose = elegirDestinatario.bind(null, quoteId);
  const create = crearDestinatario.bind(null, quoteId);
  const [chooseState, chooseAction, choosePending] = useActionState(choose, null);
  const [createState, createAction, createPending] = useActionState(create, null);
  const [nombre, setNombre] = useState("");
  const [iban, setIban] = useState("");

  if (creating) {
    return (
      <form action={createAction} className="flex flex-1 flex-col gap-4">
        <TextField label="Nombre" name="nombre" placeholder="Ana Ruiz" autoComplete="name" value={nombre} onChange={setNombre} />
        <TextField
          label="IBAN"
          name="iban"
          placeholder="ES91 2100 0418 4502 0005 1332"
          autoComplete="off"
          value={iban}
          onChange={setIban}
        />
        {createState?.error ? <ErrorNote>{createState.error}</ErrorNote> : null}
        <div className="mt-auto space-y-3">
          {recipients.length > 0 ? (
            <button type="button" className="h-12 w-full rounded-full font-bold" onClick={() => setCreating(false)}>
              Ver guardados
            </button>
          ) : null}
          <PrimaryButton disabled={createPending}>{createPending ? "Guardando…" : "Continuar"}</PrimaryButton>
        </div>
      </form>
    );
  }

  return (
    <form action={chooseAction} className="flex flex-1 flex-col gap-3">
      <fieldset className="space-y-2">
        <legend className="sr-only">Destinatarios</legend>
        {recipients.map((recipient, index) => (
          <label key={recipient.id} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 has-checked:bg-lime">
            <input type="radio" name="destinatario" value={recipient.id} defaultChecked={index === 0} className="accent-ink" />
            <span>
              <span className="block font-bold">{recipient.name}</span>
              <span className="font-mono text-xs">{recipient.iban}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {chooseState?.error ? <ErrorNote>{chooseState.error}</ErrorNote> : null}
      <button
        type="button"
        className="h-14 w-full rounded-full bg-ink font-bold text-white"
        onClick={() => setCreating(true)}
      >
        Nuevo destinatario
      </button>
      <PrimaryButton disabled={choosePending}>{choosePending ? "Un momento…" : "Continuar"}</PrimaryButton>
    </form>
  );
}
