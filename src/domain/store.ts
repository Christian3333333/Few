import type { CountryCode, Currency } from "@/domain/countries";

export type Profile = {
  userId: string;
  email: string;
  googleGivenName: string | null;
  senderName: string | null;
  dni: string | null;
  phone: string | null;
};

export type Quote = {
  id: string;
  userId: string;
  sendAmount: string;
  country: CountryCode;
  currency: Currency;
  rate: string;
  fee: string;
  receiveAmount: string;
  total: string;
  lockedAt: string;
  reference: string;
  recipientId: string | null;
};

export type Recipient = {
  id: string;
  userId: string;
  country: CountryCode;
  name: string;
  iban: string;
};

export type Transfer = {
  id: string;
  userId: string;
  quoteId: string;
  recipientId: string;
  submittedAt: string;
  sendAmount: string;
  country: CountryCode;
  currency: Currency;
  rate: string;
  fee: string;
  receiveAmount: string;
  total: string;
  reference: string;
  senderName: string;
  senderDni: string;
  senderPhone: string;
  recipientName: string;
  recipientIban: string;
  voucherContentType: string;
  voucherBytes: number;
};

export type VoucherBlob = {
  userId: string;
  transferId: string;
  contentType: string;
  bytes: Uint8Array;
};

export interface RemittanceStore {
  getProfile(userId: string): Promise<Profile | null>;
  insertProfile(profile: Profile): Promise<void>;
  updateProfile(profile: Profile): Promise<void>;
  insertQuote(quote: Quote): Promise<void>;
  updateQuote(quote: Quote): Promise<void>;
  getQuote(userId: string, quoteId: string): Promise<Quote | null>;
  listRecipients(userId: string, country: CountryCode): Promise<Recipient[]>;
  insertRecipient(recipient: Recipient): Promise<void>;
  getRecipient(userId: string, recipientId: string): Promise<Recipient | null>;
  insertTransfer(transfer: Transfer): Promise<void>;
  getTransfer(userId: string, transferId: string): Promise<Transfer | null>;
  listTransfers(userId: string): Promise<Transfer[]>;
  putVoucher(file: VoucherBlob): Promise<void>;
  getVoucher(userId: string, transferId: string): Promise<VoucherBlob | null>;
  referenceExists(reference: string): Promise<boolean>;
}
