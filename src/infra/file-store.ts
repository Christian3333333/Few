import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CountryCode } from "@/domain/countries";
import type {
  Profile,
  Quote,
  Recipient,
  RemittanceStore,
  Transfer,
  VoucherBlob,
} from "@/domain/store";

type Database = {
  profiles: Profile[];
  quotes: Quote[];
  recipients: Recipient[];
  transfers: Transfer[];
};

const root = path.join(process.cwd(), ".data");
const dbPath = path.join(root, "db.json");

let chain: Promise<unknown> = Promise.resolve();

function locked<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readDb(): Promise<Database> {
  try {
    return JSON.parse(await readFile(dbPath, "utf8")) as Database;
  } catch {
    return { profiles: [], quotes: [], recipients: [], transfers: [] };
  }
}

async function writeDb(db: Database) {
  await mkdir(root, { recursive: true });
  await writeFile(dbPath, JSON.stringify(db));
}

function voucherPath(userId: string, transferId: string) {
  return path.join(root, "vouchers", userId, transferId);
}

export function createFileStore(): RemittanceStore {
  return {
    getProfile: (userId) => locked(async () => (await readDb()).profiles.find((item) => item.userId === userId) ?? null),
    insertProfile: (profile) =>
      locked(async () => {
        const db = await readDb();
        db.profiles.push(profile);
        await writeDb(db);
      }),
    updateProfile: (profile) =>
      locked(async () => {
        const db = await readDb();
        db.profiles = db.profiles.map((item) => (item.userId === profile.userId ? profile : item));
        await writeDb(db);
      }),
    insertQuote: (quote) =>
      locked(async () => {
        const db = await readDb();
        db.quotes.push(quote);
        await writeDb(db);
      }),
    updateQuote: (quote) =>
      locked(async () => {
        const db = await readDb();
        db.quotes = db.quotes.map((item) => (item.id === quote.id ? quote : item));
        await writeDb(db);
      }),
    getQuote: (userId, quoteId) =>
      locked(async () => {
        const quote = (await readDb()).quotes.find((item) => item.id === quoteId);
        return quote && quote.userId === userId ? quote : null;
      }),
    listRecipients: (userId, country: CountryCode) =>
      locked(async () =>
        (await readDb()).recipients.filter((item) => item.userId === userId && item.country === country),
      ),
    insertRecipient: (recipient) =>
      locked(async () => {
        const db = await readDb();
        db.recipients.push(recipient);
        await writeDb(db);
      }),
    getRecipient: (userId, recipientId) =>
      locked(async () => {
        const recipient = (await readDb()).recipients.find((item) => item.id === recipientId);
        return recipient && recipient.userId === userId ? recipient : null;
      }),
    insertTransfer: (transfer) =>
      locked(async () => {
        const db = await readDb();
        db.transfers.push(transfer);
        await writeDb(db);
      }),
    getTransfer: (userId, transferId) =>
      locked(async () => {
        const transfer = (await readDb()).transfers.find((item) => item.id === transferId);
        return transfer && transfer.userId === userId ? transfer : null;
      }),
    listTransfers: (userId) =>
      locked(async () => (await readDb()).transfers.filter((item) => item.userId === userId)),
    putVoucher: (file: VoucherBlob) =>
      locked(async () => {
        const target = voucherPath(file.userId, file.transferId);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, file.bytes);
        await writeFile(`${target}.type`, file.contentType);
      }),
    getVoucher: (userId, transferId) =>
      locked(async () => {
        try {
          const target = voucherPath(userId, transferId);
          const bytes = await readFile(target);
          const contentType = (await readFile(`${target}.type`, "utf8")).trim();
          return { userId, transferId, contentType, bytes };
        } catch {
          return null;
        }
      }),
    referenceExists: (reference) =>
      locked(async () => (await readDb()).quotes.some((quote) => quote.reference === reference)),
  };
}
