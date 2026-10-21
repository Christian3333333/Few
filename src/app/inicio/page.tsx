import { requireSession } from "@/auth/session";
import { QuoteScreen } from "@/components/quote-screen";
import { TabBar } from "@/components/tab-bar";
import { countryByCode, type CountryCode } from "@/domain/countries";
import { DomainError, messageFor } from "@/domain/errors";
import { displayName, createOperations } from "@/domain/operations";
import { getStore } from "@/infra/get-store";

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; monto?: string; pais?: string; destinatario?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const store = await getStore();
  const profile = await store.getProfile(session.userId);
  const country = countryByCode(params.pais ?? "")?.code ?? ("ES" satisfies CountryCode);
  const amount = params.monto ?? "1200.00";
  const ops = createOperations(store, { now: () => new Date() });
  let preview = null;
  let notice = params.aviso === "caducada" ? "La cotización caducó. Vuelve a cotizar." : null;
  try {
    preview = ops.previewQuote({ sendAmount: amount, country });
  } catch (error) {
    if (error instanceof DomainError) notice = messageFor(error.code);
    else throw error;
  }
  const recipient = params.destinatario ? await store.getRecipient(session.userId, params.destinatario) : null;
  const name = profile ? displayName(profile) : null;
  return (
    <div className="flex flex-1 flex-col">
      <QuoteScreen
        greeting={name ? `Hola ${name}!` : "Hola"}
        initialAmount={amount}
        initialCountry={country}
        initialPreview={preview}
        recipientId={recipient && recipient.country === country ? recipient.id : null}
        notice={notice}
      />
      <div className="mt-4">
        <TabBar current="inicio" />
      </div>
    </div>
  );
}
