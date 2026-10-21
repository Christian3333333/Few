import Link from "next/link";
import { requireSession } from "@/auth/session";
import { TabBar } from "@/components/tab-bar";
import { formatForeign, formatSoles } from "@/domain/format";
import { createOperations } from "@/domain/operations";
import { getStore } from "@/infra/get-store";

export default async function ActividadPage() {
  const session = await requireSession();
  const items = await createOperations(await getStore(), { now: () => new Date() }).listActivity(session);
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex-1 space-y-4 px-5 pt-6">
        <h1 className="text-3xl font-extrabold">Últimos envíos</h1>
        {items.length === 0 ? <p className="text-sm text-muted">Todavía no tienes envíos.</p> : null}
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/envio/${item.id}`} className="block rounded-2xl bg-white px-4 py-3">
                <span className="flex items-center justify-between font-bold">
                  <span>{item.recipientName}</span>
                  <span>{item.label}</span>
                </span>
                <span className="mt-1 block text-sm text-muted">
                  {formatSoles(item.sendAmount)} · {formatForeign(item.receiveAmount, item.currency)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <section className="rounded-3xl bg-ink px-5 py-6 text-white">
          <h2 className="text-2xl font-extrabold">Envía dinero a casa</h2>
          <p className="mt-2 text-sm text-dim">Cotiza un envío de Perú a Europa.</p>
          <Link href="/inicio" className="mt-5 inline-flex h-12 items-center rounded-full bg-lime px-5 font-bold text-ink">
            Cotizar
          </Link>
        </section>
      </main>
      <TabBar current="actividad" />
    </div>
  );
}
