import type {
  Profile,
  Quote,
  Recipient,
  RemittanceStore,
  Transfer,
  VoucherBlob,
} from "@/domain/store";
import type { CountryCode } from "@/domain/countries";

export function createMemoryStore(): RemittanceStore {
  const profiles = new Map<string, Profile>();
  const quotes = new Map<string, Quote>();
  const recipients = new Map<string, Recipient>();
  const transfers = new Map<string, Transfer>();
  const vouchers = new Map<string, VoucherBlob>();

  return {
    async getProfile(userId) {
      return profiles.get(userId) ?? null;
    },
    async insertProfile(profile) {
      profiles.set(profile.userId, profile);
    },
    async updateProfile(profile) {
      profiles.set(profile.userId, profile);
    },
    async insertQuote(quote) {
      quotes.set(quote.id, quote);
    },
    async updateQuote(quote) {
      quotes.set(quote.id, quote);
    },
    async getQuote(userId, quoteId) {
      const quote = quotes.get(quoteId);
      return quote && quote.userId === userId ? quote : null;
    },
    async listRecipients(userId, country: CountryCode) {
      return [...recipients.values()].filter(
        (recipient) => recipient.userId === userId && recipient.country === country,
      );
    },
    async insertRecipient(recipient) {
      recipients.set(recipient.id, recipient);
    },
    async getRecipient(userId, recipientId) {
      const recipient = recipients.get(recipientId);
      return recipient && recipient.userId === userId ? recipient : null;
    },
    async insertTransfer(transfer) {
      transfers.set(transfer.id, transfer);
    },
    async getTransfer(userId, transferId) {
      const transfer = transfers.get(transferId);
      return transfer && transfer.userId === userId ? transfer : null;
    },
    async listTransfers(userId) {
      return [...transfers.values()].filter((transfer) => transfer.userId === userId);
    },
    async putVoucher(file) {
      vouchers.set(`${file.userId}/${file.transferId}`, file);
    },
    async getVoucher(userId, transferId) {
      return vouchers.get(`${userId}/${transferId}`) ?? null;
    },
    async referenceExists(reference) {
      return [...quotes.values()].some((quote) => quote.reference === reference);
    },
  };
}
