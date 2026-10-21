import { countryByCode, type CountryCode, type Currency } from "@/domain/countries";

const MIN_CENTS = 5_000n;
const MAX_CENTS = 2_000_000n;

const RATE_HUNDREDTHS: Record<Currency, bigint> = {
  EUR: 416n,
  CHF: 445n,
  GBP: 485n,
};

export type QuoteMath = {
  sendAmount: string;
  country: CountryCode;
  currency: Currency;
  rate: string;
  fee: string;
  receiveAmount: string;
  total: string;
};

export function parseAmount(input: string): bigint | null {
  const trimmed = input.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, frac = ""] = trimmed.split(".");
  if (whole.length > 1 && whole.startsWith("0")) return null;
  const cents = BigInt(whole) * 100n + BigInt((frac + "00").slice(0, 2));
  return cents;
}

export function amountInRange(cents: bigint): boolean {
  return cents >= MIN_CENTS && cents <= MAX_CENTS;
}

export function formatCents(cents: bigint): string {
  const whole = cents / 100n;
  const frac = (cents % 100n).toString().padStart(2, "0");
  return `${whole}.${frac}`;
}

function divHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / 2n) / denominator;
}

export function quoteMath(sendAmount: string, country: CountryCode): QuoteMath | null {
  const cents = parseAmount(sendAmount);
  if (cents === null || !amountInRange(cents)) return null;
  const meta = countryByCode(country);
  if (!meta) return null;
  const rate = RATE_HUNDREDTHS[meta.currency];
  const fee = divHalfUp(cents, 100n);
  const receive = divHalfUp(cents * 100n, rate);
  return {
    sendAmount: formatCents(cents),
    country,
    currency: meta.currency,
    rate: formatCents(rate),
    fee: formatCents(fee),
    receiveAmount: formatCents(receive),
    total: formatCents(cents + fee),
  };
}
