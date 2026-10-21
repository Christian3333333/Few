import { describe, expect, it } from "vitest";
import { DomainError } from "@/domain/errors";
import { createMemoryStore } from "@/domain/memory-store";
import { createOperations, displayName, type Clock } from "@/domain/operations";
import type { Profile, RemittanceStore } from "@/domain/store";

const ES_IBAN = "ES9121000418450200051332";
const GB_IBAN = "GB29NWBK60161331926819";
const START = new Date("2026-10-21T12:00:00.000Z");

function clockAt(start: Date): Clock & { set(date: Date): void } {
  let current = start;
  return {
    now: () => current,
    set(date: Date) {
      current = date;
    },
  };
}

function profile(userId: string, extra: Partial<Profile> = {}): Profile {
  return {
    userId,
    email: `${userId}@few.test`,
    googleGivenName: null,
    senderName: null,
    dni: null,
    phone: null,
    ...extra,
  };
}

async function ready(store: RemittanceStore, userId: string) {
  await store.insertProfile(
    profile(userId, { senderName: "María Quispe", dni: "12345678", phone: "999888777" }),
  );
}

const png = (bytes = new Uint8Array([1, 2, 3, 4])) => ({
  name: "voucher.png",
  type: "image/png",
  bytes,
});

describe("cotización", () => {
  it("calcula S/ 1,200 a España como €288.46, comisión S/ 12 y total S/ 1,212", () => {
    const ops = createOperations(createMemoryStore(), clockAt(START));
    expect(ops.previewQuote({ sendAmount: "1200", country: "ES" })).toMatchObject({
      sendAmount: "1200.00",
      currency: "EUR",
      rate: "4.16",
      fee: "12.00",
      receiveAmount: "288.46",
      total: "1212.00",
    });
  });

  it("acepta coma decimal y redondea half-up en otros corredores", () => {
    const ops = createOperations(createMemoryStore(), clockAt(START));
    expect(ops.previewQuote({ sendAmount: "1200,00", country: "ES" }).receiveAmount).toBe("288.46");
    expect(ops.previewQuote({ sendAmount: "100", country: "ES" })).toMatchObject({
      fee: "1.00",
      receiveAmount: "24.04",
      total: "101.00",
    });
    expect(ops.previewQuote({ sendAmount: "50.50", country: "ES" }).fee).toBe("0.51");
    expect(ops.previewQuote({ sendAmount: "445", country: "CH" })).toMatchObject({
      currency: "CHF",
      rate: "4.45",
      fee: "4.45",
      receiveAmount: "100.00",
      total: "449.45",
    });
    expect(ops.previewQuote({ sendAmount: "485", country: "GB" })).toMatchObject({
      currency: "GBP",
      rate: "4.85",
      fee: "4.85",
      receiveAmount: "100.00",
      total: "489.85",
    });
  });

  it("rechaza montos fuera de S/ 50 a S/ 20,000 o con más de dos decimales", () => {
    const ops = createOperations(createMemoryStore(), clockAt(START));
    expect(() => ops.previewQuote({ sendAmount: "49.99", country: "ES" })).toThrow(DomainError);
    expect(() => ops.previewQuote({ sendAmount: "20000.01", country: "ES" })).toThrow(DomainError);
    expect(() => ops.previewQuote({ sendAmount: "10.555", country: "ES" })).toThrow(DomainError);
    expect(ops.previewQuote({ sendAmount: "50", country: "ES" }).sendAmount).toBe("50.00");
    expect(ops.previewQuote({ sendAmount: "20000", country: "ES" }).sendAmount).toBe("20000.00");
  });
});

describe("candado, remitente y destinatario", () => {
  it("bloquea 15 minutos, nace FEW- de cinco dígitos y no se alarga al elegir destinatario", async () => {
    const store = createMemoryStore();
    const clock = clockAt(START);
    const ops = createOperations(store, clock);
    await ready(store, "ana");
    const quote = await ops.lockQuote({ userId: "ana" }, { sendAmount: "1200", country: "ES" });
    expect(quote.reference).toMatch(/^FEW-\d{5}$/);
    expect(quote.expiresAt).toBe("2026-10-21T12:15:00.000Z");
    expect(quote.receiveAmount).toBe("288.46");

    const recipient = await ops.saveRecipient(
      { userId: "ana" },
      quote.id,
      { name: "Ana Ruiz", iban: "ES91 2100 0418 4502 0005 1332" },
    );
    expect(recipient.iban).toBe(ES_IBAN);
    const still = await ops.readOpenQuote({ userId: "ana" }, quote.id);
    expect(still.lockedAt).toBe(quote.lockedAt);
    expect(still.recipientId).toBe(recipient.id);

    clock.set(new Date(START.getTime() + 15 * 60 * 1000 - 1));
    await expect(ops.readOpenQuote({ userId: "ana" }, quote.id)).resolves.toBeTruthy();
    clock.set(new Date(START.getTime() + 15 * 60 * 1000));
    await expect(ops.readOpenQuote({ userId: "ana" }, quote.id)).rejects.toMatchObject({ code: "expired" });
  });

  it("pide el DNI de 8 dígitos una sola vez y otra sesión no ve el perfil ni la cotización", async () => {
    const store = createMemoryStore();
    const ops = createOperations(store, clockAt(START));
    await store.insertProfile(profile("ana", { googleGivenName: "Anita" }));
    await expect(
      ops.saveSender({ userId: "ana" }, { name: "María Quispe", dni: "1234567", phone: "999888777" }),
    ).rejects.toMatchObject({ code: "dni_invalid" });
    const saved = await ops.saveSender(
      { userId: "ana" },
      { name: "María Quispe", dni: "12345678", phone: "999 888 777" },
    );
    expect(displayName(saved)).toBe("María Quispe");
    const again = await ops.saveSender(
      { userId: "ana" },
      { name: "Otra", dni: "87654321", phone: "111111111" },
    );
    expect(again.dni).toBe("12345678");
    expect(displayName(profile("solo", { googleGivenName: "Christian" }))).toBe("Christian");
    expect(displayName(profile("vacio"))).toBeNull();

    const quote = await ops.lockQuote({ userId: "ana" }, { sendAmount: "1200", country: "ES" });
    await store.insertProfile(profile("luis"));
    await expect(ops.readOpenQuote({ userId: "luis" }, quote.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(store.getProfile("luis")).resolves.toMatchObject({ senderName: null });
    await expect(store.getProfile("ana")).resolves.toMatchObject({ senderName: "María Quispe" });
  });

  it("guarda un IBAN del país, rechaza otro país o uno inválido, y no lo muestra a otra sesión", async () => {
    const store = createMemoryStore();
    const ops = createOperations(store, clockAt(START));
    await ready(store, "ana");
    await ready(store, "luis");
    const quote = await ops.lockQuote({ userId: "ana" }, { sendAmount: "1200", country: "ES" });
    await expect(
      ops.saveRecipient({ userId: "ana" }, quote.id, { name: "", iban: ES_IBAN }),
    ).rejects.toMatchObject({ code: "name_required" });
    await expect(
      ops.saveRecipient({ userId: "ana" }, quote.id, { name: "Ana", iban: GB_IBAN }),
    ).rejects.toMatchObject({ code: "iban_country" });
    await expect(
      ops.saveRecipient({ userId: "ana" }, quote.id, { name: "Ana", iban: "ES9121000418450200051333" }),
    ).rejects.toMatchObject({ code: "iban_invalid" });
    await ops.saveRecipient({ userId: "ana" }, quote.id, { name: "Ana Ruiz", iban: ES_IBAN });
    await expect(ops.listRecipients({ userId: "ana" }, quote.id)).resolves.toHaveLength(1);
    const other = await ops.lockQuote({ userId: "luis" }, { sendAmount: "1200", country: "ES" });
    await expect(ops.listRecipients({ userId: "luis" }, other.id)).resolves.toEqual([]);
  });
});

describe("voucher, avance, actividad y recibo", () => {
  async function send(clock = clockAt(START)) {
    const store = createMemoryStore();
    const ops = createOperations(store, clock);
    await ready(store, "ana");
    await ready(store, "luis");
    const quote = await ops.lockQuote({ userId: "ana" }, { sendAmount: "1200", country: "ES" });
    await ops.saveRecipient({ userId: "ana" }, quote.id, { name: "Ana Ruiz", iban: ES_IBAN });
    return { store, ops, clock, quote };
  }

  it("no crea el envío sin archivo válido o con el candado vencido", async () => {
    const { ops, clock, quote } = await send();
    await expect(
      ops.submitVoucher({ userId: "ana" }, quote.id, { name: "v.png", type: "image/png", bytes: new Uint8Array() }),
    ).rejects.toMatchObject({ code: "file_missing" });
    await expect(
      ops.submitVoucher({ userId: "ana" }, quote.id, { name: "v.txt", type: "text/plain", bytes: png().bytes }),
    ).rejects.toMatchObject({ code: "file_type" });
    await expect(
      ops.submitVoucher({ userId: "ana" }, quote.id, {
        name: "v.png",
        type: "image/png",
        bytes: new Uint8Array(10 * 1024 * 1024 + 1),
      }),
    ).rejects.toMatchObject({ code: "file_size" });
    clock.set(new Date(START.getTime() + 15 * 60 * 1000));
    await expect(ops.submitVoucher({ userId: "ana" }, quote.id, png())).rejects.toMatchObject({ code: "expired" });
    await expect(ops.listActivity({ userId: "ana" })).resolves.toEqual([]);
  });

  it("a los 0, 20 y 40 segundos lee revisión, en curso y confirmado, y aísla el archivo", async () => {
    const clock = clockAt(START);
    const { ops, quote } = await send(clock);
    const transfer = await ops.submitVoucher({ userId: "ana" }, quote.id, png());
    expect(transfer.phase).toBe("revision");
    expect(transfer.receiveAmount).toBe("288.46");
    expect(transfer.fee).toBe("12.00");
    expect(transfer.total).toBe("1212.00");
    expect(transfer.reference).toBe(quote.reference);

    clock.set(new Date(START.getTime() + 19_999));
    expect((await ops.readTransfer({ userId: "ana" }, transfer.id)).phase).toBe("revision");
    clock.set(new Date(START.getTime() + 20_000));
    expect((await ops.readTransfer({ userId: "ana" }, transfer.id)).phase).toBe("en_curso");
    clock.set(new Date(START.getTime() + 39_999));
    expect((await ops.readTransfer({ userId: "ana" }, transfer.id)).phase).toBe("en_curso");
    clock.set(new Date(START.getTime() + 40_000));
    const confirmed = await ops.readTransfer({ userId: "ana" }, transfer.id);
    expect(confirmed.phase).toBe("confirmado");
    expect(confirmed.receiveAmount).toBe("288.46");

    await expect(ops.readVoucher({ userId: "ana" }, transfer.id)).resolves.toEqual({
      contentType: "image/png",
      byteLength: 4,
    });
    await expect(ops.readTransfer({ userId: "luis" }, transfer.id)).rejects.toMatchObject({ code: "not_found" });
    await expect(ops.readVoucher({ userId: "luis" }, transfer.id)).rejects.toMatchObject({ code: "not_found" });
  });

  it("lista solo envíos creados, del más nuevo al más antiguo, y el recibo solo al confirmar", async () => {
    const clock = clockAt(START);
    const { ops, quote } = await send(clock);
    const first = await ops.submitVoucher({ userId: "ana" }, quote.id, png());
    clock.set(new Date(START.getTime() + 5_000));
    const secondQuote = await ops.lockQuote({ userId: "ana" }, { sendAmount: "500", country: "ES" });
    await ops.chooseRecipient({ userId: "ana" }, secondQuote.id, (await ops.listRecipients({ userId: "ana" }, secondQuote.id))[0].id);
    const second = await ops.submitVoucher({ userId: "ana" }, secondQuote.id, png());
    await ops.lockQuote({ userId: "ana" }, { sendAmount: "800", country: "ES" });

    let activity = await ops.listActivity({ userId: "ana" });
    expect(activity.map((item) => item.id)).toEqual([second.id, first.id]);
    expect(activity.every((item) => item.label === "Verificando")).toBe(true);
    await expect(ops.listActivity({ userId: "luis" })).resolves.toEqual([]);

    clock.set(new Date(START.getTime() + 5_000 + 40_000));
    activity = await ops.listActivity({ userId: "ana" });
    expect(activity.find((item) => item.id === second.id)?.label).toBe("Confirmado");
    expect(activity.find((item) => item.id === first.id)?.label).toBe("Confirmado");

    clock.set(new Date(START.getTime() + 20_000));
    await expect(ops.receipt({ userId: "ana" }, first.id)).rejects.toMatchObject({ code: "not_confirmed" });
    await expect(ops.sendAgain({ userId: "ana" }, first.id)).rejects.toMatchObject({ code: "not_confirmed" });

    clock.set(new Date(START.getTime() + 40_000));
    const receipt = await ops.receipt({ userId: "ana" }, first.id);
    expect(receipt.lines).toContain("Recibo de envío");
    expect(receipt.lines).toContain("Destinatario: Ana Ruiz");
    expect(receipt.lines).toContain("Enviado: S/ 1,200.00");
    expect(receipt.lines).toContain("Comisión: S/ 12.00");
    expect(receipt.lines).toContain("Recibido: €288.46");
    expect(receipt.lines).toContain(`Referencia bancaria: ${first.reference}`);
    expect(receipt.lines).toContain("Fecha: 21 de octubre de 2026");
    expect(Buffer.from(receipt.pdf.subarray(0, 4)).toString()).toBe("%PDF");
    await expect(ops.receipt({ userId: "luis" }, first.id)).rejects.toMatchObject({ code: "not_found" });

    const again = await ops.sendAgain({ userId: "ana" }, first.id);
    expect(again).toMatchObject({ sendAmount: "1200.00", country: "ES" });
    clock.set(new Date(START.getTime() + 60_000));
    const relocked = await ops.lockQuote({ userId: "ana" }, { ...again, recipientId: again.recipientId });
    expect(relocked.id).not.toBe(first.quoteId);
    expect(relocked.reference).not.toBe(first.reference);
    expect(relocked.lockedAt).toBe("2026-10-21T12:01:00.000Z");
    expect(relocked.sendAmount).toBe("1200.00");
    expect(relocked.recipientId).toBe(again.recipientId);
  });
});
