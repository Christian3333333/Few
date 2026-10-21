export const COUNTRIES = [
  { code: "ES", name: "España", currency: "EUR" },
  { code: "IT", name: "Italia", currency: "EUR" },
  { code: "DE", name: "Alemania", currency: "EUR" },
  { code: "FR", name: "Francia", currency: "EUR" },
  { code: "NL", name: "Países Bajos", currency: "EUR" },
  { code: "PT", name: "Portugal", currency: "EUR" },
  { code: "BE", name: "Bélgica", currency: "EUR" },
  { code: "IE", name: "Irlanda", currency: "EUR" },
  { code: "CH", name: "Suiza", currency: "CHF" },
  { code: "GB", name: "Reino Unido", currency: "GBP" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];
export type Currency = (typeof COUNTRIES)[number]["currency"];

export function countryByCode(code: string): (typeof COUNTRIES)[number] | undefined {
  return COUNTRIES.find((country) => country.code === code);
}

export const COLLECTION = {
  holder: "Few Peru S.A.C.",
  account: "000-0000000-0-00",
} as const;
