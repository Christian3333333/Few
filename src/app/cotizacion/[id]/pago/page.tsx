import { redirect } from "next/navigation";
import { requireSession } from "@/auth/session";
import { Countdown } from "@/components/countdown";
import { PayForm } from "@/components/pay-form";
import { BackLink, Stepper } from "@/components/ui";
import { COLLECTION } from "@/domain/countries";
import { DomainError } from "@/domain/errors";
import { formatSoles } from "@/domain/format";
import { createOperations } from "@/domain/operations";
import { getStore } from "@/infra/get-store";

export default async function PagoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const ops = createOperations(await getStore(), { now: () => new Date() });
  let quote;
  try {
    quote = await ops.readOpenQuote(session, id);
  } catch (error) {
    if (error instanceof DomainError && error.code === "expired") redirect("/inicio?aviso=caducada");
    redirect("/inicio");
  }
  if (!quote.recipientId) redirect(`/cotizacion/${id}/destinatario`);
  return (
    <main className="flex flex-1 flex-col px-5 pt-4 pb-6">
      <BackLink href={`/cotizacion/${id}/destinatario`} />
      <div className="mt-2">
        <Stepper step={3} />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold">Paga y envía.</h1>
      <div className="mt-2">
        <Countdown expiresAt={quote.expiresAt} />
      </div>
      <p className="mt-6 text-4xl font-extrabold">{formatSoles(quote.total)}</p>
      <dl className="mt-4 space-y-3 rounded-3xl bg-white p-4 text-sm">
        <div>
          <dt className="text-muted">Titular</dt>
          <dd className="font-bold">{COLLECTION.holder}</dd>
        </div>
        <div>
          <dt className="text-muted">Cuenta</dt>
          <dd className="font-mono text-base">{COLLECTION.account}</dd>
        </div>
        <div>
          <dt className="text-muted">Referencia</dt>
          <dd className="font-mono text-base">{quote.reference}</dd>
        </div>
      </dl>
      <div className="mt-6">
        <PayForm quoteId={id} />
      </div>
    </main>
  );
}
