import Link from "next/link";

export function Stepper({ step, tone = "ink" }: { step: number; tone?: "ink" | "lime" }) {
  const labels = ["Remitente", "Destinatario", "Pago", "Revisión", "Envío", "Confirmado"];
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold tracking-wide uppercase">
        Paso {step} de 6 · {labels[step - 1]}
      </p>
      <div className="flex gap-1.5" aria-hidden>
        {labels.map((label, index) => (
          <span
            key={label}
            className={`h-1.5 flex-1 rounded-full ${index < step ? (tone === "lime" ? "bg-ink" : "bg-ink") : "bg-track"}`}
          />
        ))}
      </div>
    </div>
  );
}

export function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex h-10 items-center text-sm font-bold">
      ← Volver
    </Link>
  );
}

export function PrimaryButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="h-14 w-full rounded-full bg-ink text-base font-bold text-white disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="text-sm font-semibold text-danger">
      {children}
    </p>
  );
}

export function TextField({
  label,
  name,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
  defaultValue,
  value,
  onChange,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "decimal" | "numeric" | "email";
  autoComplete?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold">{label}</span>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="h-14 w-full rounded-2xl border border-track bg-white px-4 outline-none placeholder:text-dim focus:border-ink"
      />
    </label>
  );
}
