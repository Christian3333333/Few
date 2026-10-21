export type ErrorCode =
  | "amount_invalid"
  | "amount_out_of_range"
  | "country_invalid"
  | "dni_invalid"
  | "name_required"
  | "phone_invalid"
  | "expired"
  | "not_found"
  | "iban_invalid"
  | "iban_country"
  | "file_missing"
  | "file_type"
  | "file_size"
  | "sender_missing"
  | "recipient_missing"
  | "not_confirmed";

export class DomainError extends Error {
  constructor(readonly code: ErrorCode) {
    super(code);
  }
}

const MESSAGES: Record<ErrorCode, string> = {
  amount_invalid: "Escribe un monto con hasta dos decimales.",
  amount_out_of_range: "El monto va de S/ 50 a S/ 20,000.",
  country_invalid: "Elige un país de Europa.",
  dni_invalid: "El DNI tiene 8 dígitos.",
  name_required: "El nombre es obligatorio.",
  phone_invalid: "Escribe un celular válido.",
  expired: "La cotización caducó. Vuelve a cotizar.",
  not_found: "No encontramos eso en tu cuenta.",
  iban_invalid: "El IBAN no es válido.",
  iban_country: "El IBAN no corresponde al país de la cotización.",
  file_missing: "Sube el voucher para continuar.",
  file_type: "El archivo tiene que ser JPG, PNG o PDF.",
  file_size: "El archivo pesa más de 10 MB.",
  sender_missing: "Faltan los datos de quien envía.",
  recipient_missing: "Elige un destinatario.",
  not_confirmed: "El recibo está disponible cuando el envío está confirmado.",
};

export function messageFor(code: ErrorCode): string {
  return MESSAGES[code];
}
