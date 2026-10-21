"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { entrar, entrarConGoogle, crearCuenta } from "@/app/acciones";
import { ErrorNote } from "@/components/ui";

export function AuthScreen({ mode }: { mode: "entrar" | "crear" }) {
  const action = mode === "entrar" ? entrar : crearCuenta;
  const [state, formAction, pending] = useActionState(action, null);
  const [googleState, googleAction, googlePending] = useActionState(entrarConGoogle, null);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  return (
    <main className="flex flex-1 flex-col px-5 pt-8 pb-8">
      <h1 className="text-3xl font-extrabold tracking-tight">
        {mode === "entrar" ? "¡Qué bueno volver a verte!" : "Crea tu cuenta."}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        {mode === "entrar"
          ? "Entra para cotizar de Perú a Europa."
          : "Transfiere dinero al instante entre Perú y Europa"}
      </p>
      <Illustration />
      <form action={googleAction}>
        <button
          type="submit"
          disabled={googlePending}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-track bg-white font-bold"
        >
          <GoogleMark />
          Continuar con Google
        </button>
      </form>
      {googleState?.error ? (
        <div className="mt-3">
          <ErrorNote>{googleState.error}</ErrorNote>
        </div>
      ) : null}
      <form action={formAction} className="mt-5 space-y-3">
        <label className="block">
          <span className="sr-only">Correo</span>
          <input
            name="correo"
            type="email"
            autoComplete="email"
            required
            placeholder="Correo"
            value={correo}
            onChange={(event) => setCorreo(event.target.value)}
            className="h-14 w-full rounded-2xl border border-track bg-white px-4 outline-none placeholder:text-dim focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="sr-only">Contraseña</span>
          <input
            name="contrasena"
            type="password"
            autoComplete={mode === "entrar" ? "current-password" : "new-password"}
            required
            minLength={6}
            placeholder="Contraseña"
            value={contrasena}
            onChange={(event) => setContrasena(event.target.value)}
            className="h-14 w-full rounded-2xl border border-track bg-white px-4 outline-none placeholder:text-dim focus:border-ink"
          />
        </label>
        {state?.error ? <ErrorNote>{state.error}</ErrorNote> : null}
        <button type="submit" disabled={pending} className="h-14 w-full rounded-full bg-ink font-bold text-white disabled:opacity-40">
          {pending ? "Un momento…" : mode === "entrar" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>
      <p className="mt-auto pt-8 text-center text-sm">
        {mode === "entrar" ? (
          <Link href="/crear-cuenta" className="font-bold underline">
            Crear cuenta
          </Link>
        ) : (
          <Link href="/entrar" className="font-bold underline">
            Ingresar
          </Link>
        )}
      </p>
    </main>
  );
}

function Illustration() {
  return (
    <svg viewBox="0 0 320 150" className="my-6 h-36 w-full" role="img" aria-label="Un envío de Perú a Europa">
      <rect x="16" y="36" width="110" height="78" rx="22" fill="#0a0a0a" />
      <text x="71" y="82" textAnchor="middle" fill="#d7ff1f" fontSize="22" fontWeight="700">
        S/
      </text>
      <path d="M140 75h40" stroke="#0a0a0a" strokeWidth="4" />
      <path d="M172 64l14 11-14 11" fill="none" stroke="#0a0a0a" strokeWidth="4" />
      <circle cx="230" cy="75" r="42" fill="#d7ff1f" />
      <text x="230" y="82" textAnchor="middle" fill="#0a0a0a" fontSize="22" fontWeight="700">
        €
      </text>
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" />
      <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.9 10.7A5.4 5.4 0 0 1 3.6 9c0-.6.1-1.2.3-1.7V5H.9A9 9 0 0 0 0 9c0 1.4.3 2.8.9 4l3-2.3z" />
      <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z" />
    </svg>
  );
}
