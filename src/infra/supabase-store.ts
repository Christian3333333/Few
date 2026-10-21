import type { SupabaseClient } from "@supabase/supabase-js";
import type { CountryCode, Currency } from "@/domain/countries";
import type {
  Profile,
  Quote,
  Recipient,
  RemittanceStore,
  Transfer,
  VoucherBlob,
} from "@/domain/store";

type ProfileRow = {
  user_id: string;
  email: string;
  google_given_name: string | null;
  sender_name: string | null;
  dni: string | null;
  phone: string | null;
};

function toProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    email: row.email,
    googleGivenName: row.google_given_name,
    senderName: row.sender_name,
    dni: row.dni,
    phone: row.phone,
  };
}

function decimal(value: unknown): string {
  const text = typeof value === "number" ? value.toFixed(2) : String(value ?? "");
  const [whole, frac = ""] = text.split(".");
  return `${whole}.${frac.padEnd(2, "0").slice(0, 2)}`;
}

function toQuote(row: Record<string, unknown>): Quote {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    sendAmount: decimal(row.send_amount),
    country: String(row.country) as CountryCode,
    currency: String(row.currency) as Currency,
    rate: decimal(row.rate),
    fee: decimal(row.fee),
    receiveAmount: decimal(row.receive_amount),
    total: decimal(row.total),
    lockedAt: String(row.locked_at),
    reference: String(row.reference),
    recipientId: row.recipient_id == null ? null : String(row.recipient_id),
  };
}

export function createSupabaseStore(client: SupabaseClient): RemittanceStore {
  return {
    async getProfile(userId) {
      const { data } = await client.from("perfiles").select("*").eq("user_id", userId).maybeSingle();
      return data ? toProfile(data as ProfileRow) : null;
    },
    async insertProfile(profile) {
      const { error } = await client.from("perfiles").insert({
        user_id: profile.userId,
        email: profile.email,
        google_given_name: profile.googleGivenName,
        sender_name: profile.senderName,
        dni: profile.dni,
        phone: profile.phone,
      });
      if (error) throw error;
    },
    async updateProfile(profile) {
      const { error } = await client
        .from("perfiles")
        .update({
          sender_name: profile.senderName,
          dni: profile.dni,
          phone: profile.phone,
          google_given_name: profile.googleGivenName,
        })
        .eq("user_id", profile.userId);
      if (error) throw error;
    },
    async insertQuote(quote) {
      const { error } = await client.from("cotizaciones").insert({
        id: quote.id,
        user_id: quote.userId,
        send_amount: quote.sendAmount,
        country: quote.country,
        currency: quote.currency,
        rate: quote.rate,
        fee: quote.fee,
        receive_amount: quote.receiveAmount,
        total: quote.total,
        locked_at: quote.lockedAt,
        reference: quote.reference,
        recipient_id: quote.recipientId,
      });
      if (error) throw error;
    },
    async updateQuote(quote) {
      const { error } = await client
        .from("cotizaciones")
        .update({ recipient_id: quote.recipientId })
        .eq("id", quote.id)
        .eq("user_id", quote.userId);
      if (error) throw error;
    },
    async getQuote(userId, quoteId) {
      const { data } = await client.from("cotizaciones").select("*").eq("id", quoteId).eq("user_id", userId).maybeSingle();
      return data ? toQuote(data as Record<string, unknown>) : null;
    },
    async listRecipients(userId, country) {
      const { data } = await client.from("destinatarios").select("*").eq("user_id", userId).eq("country", country);
      return (data ?? []).map((row) => ({
        id: row.id as string,
        userId: row.user_id as string,
        country: row.country as CountryCode,
        name: row.name as string,
        iban: row.iban as string,
      }));
    },
    async insertRecipient(recipient: Recipient) {
      const { error } = await client.from("destinatarios").insert({
        id: recipient.id,
        user_id: recipient.userId,
        country: recipient.country,
        name: recipient.name,
        iban: recipient.iban,
      });
      if (error) throw error;
    },
    async getRecipient(userId, recipientId) {
      const { data } = await client
        .from("destinatarios")
        .select("*")
        .eq("id", recipientId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id as string,
        userId: data.user_id as string,
        country: data.country as CountryCode,
        name: data.name as string,
        iban: data.iban as string,
      };
    },
    async insertTransfer(transfer: Transfer) {
      const { error } = await client.from("envios").insert({
        id: transfer.id,
        user_id: transfer.userId,
        quote_id: transfer.quoteId,
        recipient_id: transfer.recipientId,
        submitted_at: transfer.submittedAt,
        send_amount: transfer.sendAmount,
        country: transfer.country,
        currency: transfer.currency,
        rate: transfer.rate,
        fee: transfer.fee,
        receive_amount: transfer.receiveAmount,
        total: transfer.total,
        reference: transfer.reference,
        sender_name: transfer.senderName,
        sender_dni: transfer.senderDni,
        sender_phone: transfer.senderPhone,
        recipient_name: transfer.recipientName,
        recipient_iban: transfer.recipientIban,
        voucher_content_type: transfer.voucherContentType,
        voucher_bytes: transfer.voucherBytes,
      });
      if (error) throw error;
    },
    async getTransfer(userId, transferId) {
      const { data } = await client
        .from("envios")
        .select("*")
        .eq("id", transferId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!data) return null;
      return mapTransfer(data as Record<string, unknown>);
    },
    async listTransfers(userId) {
      const { data } = await client.from("envios").select("*").eq("user_id", userId);
      return (data ?? []).map((row) => mapTransfer(row as Record<string, unknown>));
    },
    async putVoucher(file: VoucherBlob) {
      const { error } = await client.storage
        .from("vouchers")
        .upload(`${file.userId}/${file.transferId}`, file.bytes, {
          contentType: file.contentType,
          upsert: false,
        });
      if (error) throw error;
    },
    async getVoucher(userId, transferId) {
      const { data, error } = await client.storage.from("vouchers").download(`${userId}/${transferId}`);
      if (error || !data) return null;
      const bytes = new Uint8Array(await data.arrayBuffer());
      return { userId, transferId, contentType: data.type || "application/octet-stream", bytes };
    },
    async referenceExists(reference) {
      const { data } = await client.from("cotizaciones").select("id").eq("reference", reference).limit(1);
      return Boolean(data?.length);
    },
  };
}

function mapTransfer(row: Record<string, unknown>): Transfer {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    quoteId: String(row.quote_id),
    recipientId: String(row.recipient_id),
    submittedAt: String(row.submitted_at),
    sendAmount: decimal(row.send_amount),
    country: String(row.country) as CountryCode,
    currency: String(row.currency) as Currency,
    rate: decimal(row.rate),
    fee: decimal(row.fee),
    receiveAmount: decimal(row.receive_amount),
    total: decimal(row.total),
    reference: String(row.reference),
    senderName: String(row.sender_name),
    senderDni: String(row.sender_dni),
    senderPhone: String(row.sender_phone),
    recipientName: String(row.recipient_name),
    recipientIban: String(row.recipient_iban),
    voucherContentType: String(row.voucher_content_type),
    voucherBytes: Number(row.voucher_bytes),
  };
}
