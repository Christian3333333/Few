import { requireSession } from "@/auth/session";
import { Countdown } from "@/components/countdown";
import { RecipientScreen } from "@/components/recipient-screen";
import { BackLink, Stepper } from "@/components/ui";
import { DomainError } from "@/domain/errors";
import { createOperations } from "@/domain/operations";
import { getStore } from "@/infra/get-store";
import { redirect } from "next/navigation";

export default async function DestinatarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const store = await getStore();
  const ops = createOperations(store, { now: () => new Date() });
  const quote = await openOrRestart(ops, session, id);
  const profile = await store.getProfile(session.userId);
  if (!profile?.senderName || !profile.dni || !profile.phone) redirect(`/cotizacion/${id}/remitente`);
  const recipients = await ops.listRecipients(session, id);
  return (
    <main className="flex flex-1 flex-col px-5 pt-4 pb-6">
      <BackLink href="/inicio" />
      <div className="mt-2">
        <Stepper step={2} />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold">¿Quién recibe?</h1>
      <div className="mt-2">
        <Countdown expiresAt={quote.expiresAt} />
      </div>
      <div className="mt-6 flex flex-1 flex-col">
        <RecipientScreen quoteId={id} recipients={recipients} />
      </div>
    </main>
  );
}

async function openOrRestart(
  ops: ReturnType<typeof createOperations>,
  session: { userId: string },
  id: string,
) {
  try {
    return await ops.readOpenQuote(session, id);
  } catch (error) {
    if (error instanceof DomainError && error.code === "expired") redirect("/inicio?aviso=caducada");
    redirect("/inicio");
  }
}
