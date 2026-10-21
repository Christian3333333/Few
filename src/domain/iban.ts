import type { CountryCode } from "@/domain/countries";

const LENGTHS: Record<CountryCode, number> = {
  ES: 24,
  IT: 27,
  DE: 22,
  FR: 27,
  NL: 18,
  PT: 25,
  BE: 16,
  IE: 22,
  CH: 21,
  GB: 22,
};

export function normalizeIban(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}

export function ibanMatchesCountry(iban: string, country: CountryCode): boolean {
  const value = normalizeIban(iban);
  if (!value.startsWith(country) || value.length !== LENGTHS[country]) return false;
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(value)) return false;
  const rearranged = value.slice(4) + value.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const digits = char >= "A" && char <= "Z" ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of digits) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}
