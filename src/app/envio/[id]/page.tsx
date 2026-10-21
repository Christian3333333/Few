import Link from "next/link";
import { requireSession } from "@/auth/session";
import { AutoRefresh } from "@/components/auto-refresh";
import { Stepper } from "@/components/ui";
import { DomainError } from "@/domain/errors";
import { formatDate, formatForeign, formatSoles } from "@/domain/format";
import { createOperations } from "@/domain/operations";
import { getStore } from "@/infra/get-store";
import { notFound } from "next/navigation";

export default async function EnvioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const ops = createOperations(await getStore(), { now: () => new Date() });
  let transfer;
  try {
    transfer = await ops.readTransfer(session, id);
  } catch (error) {
    if (error instanceof DomainError) notFound();
    throw error;
  }

  const tone = transfer.phase === "en_curso" ? "lime" : "ink";
  const step = transfer.phase === "revision" ? 4 : transfer.phase === "en_curso" ? 5 : 6;

  return (
    <main className={`flex flex-1 flex-col px-5 pt-6 pb-8 ${transfer.phase === "en_curso" ? "bg-lime" : ""}`}>
      <AutoRefresh active={transfer.phase !== "confirmado"} />
      <Stepper step={step} tone={tone} />
      {transfer.phase === "revision" ? (
        <>
          <h1 className="mt-6 text-3xl font-extrabold">Revisando tu voucher.</h1>
          <Checklist
            rows={[
              ["Remitente", "Listo"],
              ["Destinatario", "Listo"],
              ["Pago", "Listo"],
              ["Revisión", "En curso"],
              ["Envío", "Pendiente"],
            ]}
          />
        </>
      ) : null}
      {transfer.phase === "en_curso" ? (
        <>
          <h1 className="mt-6 text-3xl font-extrabold">El dinero ya va.</h1>
          <p className="mt-3 text-lg font-bold">
            {formatSoles(transfer.sendAmount)} hacia {transfer.recipientName}
          </p>
          <Checklist
            rows={[
              ["Remitente", "Listo"],
              ["Destinatario", "Listo"],
              ["Pago", "Listo"],
              ["Revisión", "Listo"],
              ["Envío", "En curso"],
            ]}
          />
        </>
      ) : null}
      {transfer.phase === "confirmado" ? (
        <>
          <h1 className="mt-6 text-3xl font-extrabold">El dinero llegó.</h1>
          <dl className="mt-6 space-y-3 text-sm">
            <Item label="Destinatario" value={transfer.recipientName} />
            <Item label="Enviado" value={formatSoles(transfer.sendAmount)} />
            <Item label="Comisión" value={formatSoles(transfer.fee)} />
            <Item label="Recibido" value={formatForeign(transfer.receiveAmount, transfer.currency)} />
            <Item label="Referencia bancaria" value={transfer.reference} />
            <Item label="Fecha" value={formatDate(transfer.submittedAt)} />
          </dl>
          <div className="mt-8 space-y-3">
            <Link
              href={`/inicio?monto=${transfer.sendAmount}&pais=${transfer.country}&destinatario=${transfer.recipientId}`}
              className="flex h-14 items-center justify-center rounded-full bg-ink font-bold text-white"
            >
              Enviar de nuevo
            </Link>
            <a href={`/recibo/${transfer.id}`} className="flex h-14 items-center justify-center rounded-full font-bold">
              Descargar recibo
            </a>
          </div>
        </>
      ) : null}
    </main>
  );
}

function Checklist({ rows }: { rows: Array<[string, string]> }) {
  return (
    <ul className="mt-6 space-y-3">
      {rows.map(([name, status]) => (
        <li key={name} className="flex items-center justify-between text-sm font-bold">
          <span>{name}</span>
          <span className={status === "En curso" ? "" : "text-muted"}>{status}</span>
        </li>
      ))}
    </ul>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}
