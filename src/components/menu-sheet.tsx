"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { cerrarSesion } from "@/app/acciones";

export function MenuSheet({
  email,
  senderName,
  dni,
  phone,
}: {
  email: string | null;
  senderName: string | null;
  dni: string | null;
  phone: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-full text-white"
        aria-expanded={open}
        aria-controls={titleId}
        aria-label="Abrir menú"
        onClick={() => setOpen(true)}
      >
        <span className="flex w-5 flex-col gap-1.5" aria-hidden>
          <span className="h-0.5 bg-white" />
          <span className="h-0.5 bg-white" />
          <span className="h-0.5 bg-white" />
        </span>
      </button>
      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-50 mx-auto w-full max-w-[430px]">
              <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Cerrar menú" onClick={() => setOpen(false)} />
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="absolute inset-x-0 top-0 rounded-b-3xl bg-white px-5 pt-5 pb-6 shadow-xl"
              >
                <div className="mb-5 flex items-center justify-between">
                  <h2 id={titleId} className="text-lg font-extrabold">
                    {email ? "Tu cuenta" : "Cómo funciona"}
                  </h2>
                  <button type="button" className="grid h-10 w-10 place-items-center text-xl" aria-label="Cerrar" onClick={() => setOpen(false)}>
                    ×
                  </button>
                </div>
                {email ? (
                  <div className="space-y-3 text-sm">
                    <p className="font-semibold">{email}</p>
                    {senderName ? <Field label="Nombre" value={senderName} /> : null}
                    {dni ? <Field label="DNI" value={dni} /> : null}
                    {phone ? <Field label="Celular" value={phone} /> : null}
                    <form action={cerrarSesion} className="pt-2">
                      <button type="submit" className="h-12 w-full rounded-full bg-ink font-bold text-white">
                        Cerrar sesión
                      </button>
                    </form>
                  </div>
                ) : (
                  <ol className="space-y-3 text-sm text-muted">
                    <li>1. Cotiza cuánto llega a Europa.</li>
                    <li>2. Paga a la cuenta de Few.</li>
                    <li>3. Sube el voucher.</li>
                  </ol>
                )}
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="block text-xs font-semibold tracking-wide text-muted uppercase">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </p>
  );
}
