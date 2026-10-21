import type { Currency } from "@/domain/countries";

export function formatSoles(amount: string): string {
  return `S/ ${group(amount)}`;
}

export function formatForeign(amount: string, currency: Currency): string {
  const number = group(amount);
  if (currency === "EUR") return `€${number}`;
  if (currency === "GBP") return `£${number}`;
  return `CHF ${number}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Lima",
  }).format(new Date(iso));
}

function group(amount: string): string {
  const [whole, frac = "00"] = amount.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped}.${frac.padEnd(2, "0").slice(0, 2)}`;
}
