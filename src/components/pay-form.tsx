"use client";

import { useActionState } from "react";
import { enviarVoucher } from "@/app/acciones";
import { ErrorNote, PrimaryButton } from "@/components/ui";

export function PayForm({ quoteId }: { quoteId: string }) {
  const action = enviarVoucher.bind(null, quoteId);
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-dim bg-white px-4 text-center">
        <span className="font-bold">Sube el voucher</span>
        <span className="mt-1 text-sm text-muted">JPG, PNG o PDF, hasta 10 MB</span>
        <input name="voucher" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" required className="mt-3 max-w-full text-sm" />
      </label>
      {state?.error ? <ErrorNote>{state.error}</ErrorNote> : null}
      <PrimaryButton disabled={pending}>{pending ? "Enviando…" : "Enviar voucher"}</PrimaryButton>
    </form>
  );
}
