import { countryByCode, type CountryCode } from "@/domain/countries";
import { DomainError } from "@/domain/errors";
import { ibanMatchesCountry, normalizeIban } from "@/domain/iban";
import { amountInRange, parseAmount, quoteMath } from "@/domain/money";
import { buildReceiptPdf, receiptLines, type ReceiptFields } from "@/domain/receipt";
import type { Profile, Quote, Recipient, RemittanceStore, Transfer } from "@/domain/store";

const LOCK_MS = 15 * 60 * 1000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export type Clock = { now(): Date };
export type Session = { userId: string };

export type Phase = "revision" | "en_curso" | "confirmado";

export type OpenQuote = Quote & { expiresAt: string };

export type TransferView = Transfer & { phase: Phase };

export type ActivityItem = {
  id: string;
  recipientName: string;
  sendAmount: string;
  receiveAmount: string;
  currency: Transfer["currency"];
  country: CountryCode;
  label: "Verificando" | "Confirmado";
  phase: Phase;
  submittedAt: string;
};

export type VoucherInput = {
  name: string;
  type: string;
  bytes: Uint8Array;
};

export function displayName(profile: Pick<Profile, "senderName" | "googleGivenName">): string | null {
  if (profile.senderName?.trim()) return profile.senderName.trim();
  if (profile.googleGivenName?.trim()) return profile.googleGivenName.trim();
  return null;
}

export function phaseAt(submittedAt: string, now: Date): Phase {
  const elapsed = now.getTime() - new Date(submittedAt).getTime();
  if (elapsed < 20_000) return "revision";
  if (elapsed < 40_000) return "en_curso";
  return "confirmado";
}

function senderReady(profile: Profile | null): profile is Profile & {
  senderName: string;
  dni: string;
  phone: string;
} {
  return Boolean(profile?.senderName && profile.dni && profile.phone);
}

function openQuote(quote: Quote, now: Date): OpenQuote {
  const expires = new Date(quote.lockedAt).getTime() + LOCK_MS;
  if (now.getTime() >= expires) throw new DomainError("expired");
  return { ...quote, expiresAt: new Date(expires).toISOString() };
}

function acceptedType(file: VoucherInput): string | null {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (type === "image/jpeg" || type === "image/jpg") return "image/jpeg";
  if (type === "image/png") return "image/png";
  if (type === "application/pdf") return "application/pdf";
  if (!type) {
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".pdf")) return "application/pdf";
  }
  return null;
}

async function freshReference(store: RemittanceStore): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const digits = Math.floor(Math.random() * 100_000)
      .toString()
      .padStart(5, "0");
    const reference = `FEW-${digits}`;
    if (!(await store.referenceExists(reference))) return reference;
  }
  throw new DomainError("not_found");
}

export function createOperations(store: RemittanceStore, clock: Clock) {
  async function requireQuote(userId: string, quoteId: string): Promise<Quote> {
    const quote = await store.getQuote(userId, quoteId);
    if (!quote) throw new DomainError("not_found");
    return quote;
  }

  return {
    previewQuote(input: { sendAmount: string; country: string }) {
      const country = countryByCode(input.country);
      if (!country) throw new DomainError("country_invalid");
      const cents = parseAmount(input.sendAmount);
      if (cents === null) throw new DomainError("amount_invalid");
      if (!amountInRange(cents)) throw new DomainError("amount_out_of_range");
      const math = quoteMath(input.sendAmount, country.code);
      if (!math) throw new DomainError("amount_invalid");
      return math;
    },

    async lockQuote(
      session: Session,
      input: { sendAmount: string; country: string; recipientId?: string | null },
    ): Promise<OpenQuote> {
      const math = this.previewQuote(input);
      let recipientId: string | null = null;
      if (input.recipientId) {
        const recipient = await store.getRecipient(session.userId, input.recipientId);
        if (!recipient || recipient.country !== math.country) throw new DomainError("iban_country");
        recipientId = recipient.id;
      }
      const quote: Quote = {
        id: crypto.randomUUID(),
        userId: session.userId,
        sendAmount: math.sendAmount,
        country: math.country,
        currency: math.currency,
        rate: math.rate,
        fee: math.fee,
        receiveAmount: math.receiveAmount,
        total: math.total,
        lockedAt: clock.now().toISOString(),
        reference: await freshReference(store),
        recipientId,
      };
      await store.insertQuote(quote);
      return openQuote(quote, clock.now());
    },

    async readOpenQuote(session: Session, quoteId: string): Promise<OpenQuote> {
      return openQuote(await requireQuote(session.userId, quoteId), clock.now());
    },

    async saveSender(
      session: Session,
      input: { name: string; dni: string; phone: string },
    ): Promise<Profile> {
      const profile = await store.getProfile(session.userId);
      if (!profile) throw new DomainError("not_found");
      if (senderReady(profile)) return profile;
      const name = input.name.trim().replace(/\s+/g, " ");
      const dni = input.dni.trim();
      const phoneDigits = input.phone.replace(/\D/g, "");
      if (!name) throw new DomainError("name_required");
      if (!/^\d{8}$/.test(dni)) throw new DomainError("dni_invalid");
      if (phoneDigits.length < 6 || phoneDigits.length > 15) throw new DomainError("phone_invalid");
      const next: Profile = { ...profile, senderName: name, dni, phone: input.phone.trim() };
      await store.updateProfile(next);
      return next;
    },

    async listRecipients(session: Session, quoteId: string): Promise<Recipient[]> {
      const quote = await this.readOpenQuote(session, quoteId);
      return store.listRecipients(session.userId, quote.country);
    },

    async saveRecipient(
      session: Session,
      quoteId: string,
      input: { name: string; iban: string },
    ): Promise<Recipient> {
      const quote = await this.readOpenQuote(session, quoteId);
      const lockedAt = quote.lockedAt;
      const name = input.name.trim().replace(/\s+/g, " ");
      if (!name) throw new DomainError("name_required");
      const iban = normalizeIban(input.iban);
      if (!iban.startsWith(quote.country)) throw new DomainError("iban_country");
      if (!ibanMatchesCountry(iban, quote.country)) throw new DomainError("iban_invalid");
      const recipient: Recipient = {
        id: crypto.randomUUID(),
        userId: session.userId,
        country: quote.country,
        name,
        iban,
      };
      await store.insertRecipient(recipient);
      await store.updateQuote({ ...quote, recipientId: recipient.id, lockedAt });
      return recipient;
    },

    async chooseRecipient(session: Session, quoteId: string, recipientId: string): Promise<OpenQuote> {
      const quote = await this.readOpenQuote(session, quoteId);
      const recipient = await store.getRecipient(session.userId, recipientId);
      if (!recipient) throw new DomainError("not_found");
      if (recipient.country !== quote.country) throw new DomainError("iban_country");
      const next: Quote = { ...quote, recipientId: recipient.id, lockedAt: quote.lockedAt };
      await store.updateQuote(next);
      return openQuote(next, clock.now());
    },

    async submitVoucher(session: Session, quoteId: string, file: VoucherInput): Promise<TransferView> {
      const quote = await this.readOpenQuote(session, quoteId);
      const profile = await store.getProfile(session.userId);
      if (!senderReady(profile)) throw new DomainError("sender_missing");
      if (!quote.recipientId) throw new DomainError("recipient_missing");
      const recipient = await store.getRecipient(session.userId, quote.recipientId);
      if (!recipient) throw new DomainError("recipient_missing");
      if (file.bytes.byteLength === 0) throw new DomainError("file_missing");
      if (file.bytes.byteLength > MAX_FILE_BYTES) throw new DomainError("file_size");
      const contentType = acceptedType(file);
      if (!contentType) throw new DomainError("file_type");
      const transfer: Transfer = {
        id: crypto.randomUUID(),
        userId: session.userId,
        quoteId: quote.id,
        recipientId: recipient.id,
        submittedAt: clock.now().toISOString(),
        sendAmount: quote.sendAmount,
        country: quote.country,
        currency: quote.currency,
        rate: quote.rate,
        fee: quote.fee,
        receiveAmount: quote.receiveAmount,
        total: quote.total,
        reference: quote.reference,
        senderName: profile.senderName,
        senderDni: profile.dni,
        senderPhone: profile.phone,
        recipientName: recipient.name,
        recipientIban: recipient.iban,
        voucherContentType: contentType,
        voucherBytes: file.bytes.byteLength,
      };
      await store.putVoucher({
        userId: session.userId,
        transferId: transfer.id,
        contentType,
        bytes: file.bytes,
      });
      await store.insertTransfer(transfer);
      return { ...transfer, phase: "revision" };
    },

    async readTransfer(session: Session, transferId: string): Promise<TransferView> {
      const transfer = await store.getTransfer(session.userId, transferId);
      if (!transfer) throw new DomainError("not_found");
      return { ...transfer, phase: phaseAt(transfer.submittedAt, clock.now()) };
    },

    async readVoucher(session: Session, transferId: string) {
      const transfer = await store.getTransfer(session.userId, transferId);
      if (!transfer) throw new DomainError("not_found");
      const file = await store.getVoucher(session.userId, transferId);
      if (!file) throw new DomainError("not_found");
      return { contentType: file.contentType, byteLength: file.bytes.byteLength };
    },

    async listActivity(session: Session): Promise<ActivityItem[]> {
      const transfers = await store.listTransfers(session.userId);
      return transfers
        .slice()
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .map((transfer) => {
          const phase = phaseAt(transfer.submittedAt, clock.now());
          return {
            id: transfer.id,
            recipientName: transfer.recipientName,
            sendAmount: transfer.sendAmount,
            receiveAmount: transfer.receiveAmount,
            currency: transfer.currency,
            country: transfer.country,
            label: phase === "confirmado" ? "Confirmado" : "Verificando",
            phase,
            submittedAt: transfer.submittedAt,
          };
        });
    },

    async sendAgain(session: Session, transferId: string) {
      const transfer = await this.readTransfer(session, transferId);
      if (transfer.phase !== "confirmado") throw new DomainError("not_confirmed");
      const recipient = await store.getRecipient(session.userId, transfer.recipientId);
      return {
        sendAmount: transfer.sendAmount,
        country: transfer.country,
        recipientId: recipient?.id ?? null,
      };
    },

    async receipt(session: Session, transferId: string) {
      const transfer = await this.readTransfer(session, transferId);
      if (transfer.phase !== "confirmado") throw new DomainError("not_confirmed");
      const fields: ReceiptFields = {
        recipientName: transfer.recipientName,
        sendAmount: transfer.sendAmount,
        fee: transfer.fee,
        receiveAmount: transfer.receiveAmount,
        currency: transfer.currency,
        reference: transfer.reference,
        submittedAt: transfer.submittedAt,
      };
      return { fields, lines: receiptLines(fields), pdf: await buildReceiptPdf(fields) };
    },
  };
}
