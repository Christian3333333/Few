"use client";

import { useMemo, useState, useTransition } from "react";
import { useActionState } from "react";
import { continuar, previsualizar } from "@/app/acciones";
import { COUNTRIES, type CountryCode } from "@/domain/countries";
import { formatForeign, formatSoles } from "@/domain/format";
import type { QuoteMath } from "@/domain/money";
import { ErrorNote, PrimaryButton } from "@/components/ui";

export function QuoteScreen({
  greeting,
  initialAmount,
  initialCountry,
  initialPreview,
  recipientId,
  notice,
}: {
  greeting: string;
  initialAmount: string;
  initialCountry: CountryCode;
  initialPreview: QuoteMath | null;
  recipientId: string | null;
  notice: string | null;
}) {
  const [amount, setAmount] = useState(initialAmount);
  const [country, setCountry] = useState(initialCountry);
  const [preview, setPreview] = useState(initialPreview);
  const [error, setError] = useState<string | null>(notice);
  const [sheet, setSheet] = useState(false);
  const [pendingPreview, startPreview] = useTransition();
  const [state, formAction, pending] = useActionState(continuar, null);

  function refresh(nextAmount: string, nextCountry: CountryCode) {
    startPreview(async () => {
      const result = await previsualizar(nextAmount, nextCountry);
      if (result.ok) {
        setPreview(result.preview);
        setError(null);
      } else {
        setPreview(null);
        setError(result.error);
      }
    });
  }

  const countryName = COUNTRIES.find((item) => item.code === country)?.name ?? "España";

  return (
    <>
      <main className="flex-1 space-y-5 px-5 pt-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{greeting}</h1>
          <p className="mt-2 text-muted">¿Cuánto enviamos hoy?</p>
        </div>
        <div className="grid grid-cols-2 rounded-full bg-track p-1 text-sm font-bold">
          <span className="rounded-full bg-ink py-3 text-center text-white">Perú → Europa</span>
          <button type="button" disabled className="rounded-full py-3 text-muted opacity-45" aria-disabled="true">
            Europa → Perú
          </button>
        </div>
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="flex h-14 w-full items-center justify-between rounded-2xl bg-white px-4 font-bold"
        >
          <span>{countryName}</span>
          <span aria-hidden>▾</span>
        </button>
        <label className="block space-y-2">
          <span className="text-sm font-bold">Tú envías</span>
          <span className="flex h-14 items-center rounded-2xl bg-white px-4">
            <span className="font-bold text-muted">S/</span>
            <input
              value={amount}
              inputMode="decimal"
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                const next = event.target.value;
                setAmount(next);
                refresh(next, country);
              }}
              className="h-full w-full bg-transparent px-2 text-lg font-extrabold outline-none"
            />
          </span>
        </label>
        <div>
          <p className="text-sm font-bold text-muted">Ellos reciben</p>
          <p className="text-4xl font-extrabold tracking-tight">
            {preview ? formatForeign(preview.receiveAmount, preview.currency) : "—"}
          </p>
        </div>
        <dl className="space-y-2 text-sm">
          <Row label="Tipo" value={preview ? formatSoles(preview.rate) : "—"} />
          <Row label="Comisión" value={preview ? formatSoles(preview.fee) : "—"} />
          <Row label="Total" value={preview ? formatSoles(preview.total) : "—"} strong />
        </dl>
        {error ? <ErrorNote>{error}</ErrorNote> : null}
        {state?.error ? <ErrorNote>{state.error}</ErrorNote> : null}
      </main>
      <form action={formAction} className="px-5 pt-4">
        <input type="hidden" name="monto" value={amount} />
        <input type="hidden" name="pais" value={country} />
        {recipientId ? <input type="hidden" name="destinatario" value={recipientId} /> : null}
        <PrimaryButton disabled={pending || pendingPreview || !preview}>{pending ? "Un momento…" : "Continuar"}</PrimaryButton>
      </form>
      {sheet ? (
        <CountrySheet
          selected={country}
          onClose={() => setSheet(false)}
          onSelect={(next) => {
            setCountry(next);
            setSheet(false);
            refresh(amount, next);
          }}
        />
      ) : null}
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "font-extrabold" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function CountrySheet({
  selected,
  onClose,
  onSelect,
}: {
  selected: CountryCode;
  onClose: () => void;
  onSelect: (country: CountryCode) => void;
}) {
  const [query, setQuery] = useState("");
  const countries = useMemo(() => {
    const folded = fold(query);
    return COUNTRIES.filter((country) => fold(country.name).includes(folded));
  }, [query]);

  return (
    <div className="fixed inset-0 z-30 mx-auto flex w-full max-w-[430px] items-end">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Cerrar países" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-labelledby="paises" className="relative max-h-[80%] w-full rounded-t-3xl bg-paper px-5 pt-4 pb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="paises" className="text-xl font-extrabold">
            ¿A qué país?
          </h2>
          <button type="button" className="grid h-10 w-10 place-items-center text-xl" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar país"
          className="mb-3 h-12 w-full rounded-2xl bg-white px-4 outline-none"
        />
        <ul className="max-h-80 space-y-1 overflow-auto">
          {countries.map((country) => (
            <li key={country.code}>
              <button
                type="button"
                onClick={() => onSelect(country.code)}
                className={`flex h-12 w-full items-center justify-between rounded-2xl px-3 text-left font-bold ${country.code === selected ? "bg-lime" : "bg-white"}`}
              >
                {country.name}
                <span className="text-xs text-muted">{country.currency}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function fold(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
