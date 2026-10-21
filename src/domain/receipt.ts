import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Currency } from "@/domain/countries";
import { formatDate, formatForeign, formatSoles } from "@/domain/format";

export type ReceiptFields = {
  recipientName: string;
  sendAmount: string;
  fee: string;
  receiveAmount: string;
  currency: Currency;
  reference: string;
  submittedAt: string;
};

export function receiptLines(fields: ReceiptFields): string[] {
  return [
    "Recibo de envío",
    `Destinatario: ${fields.recipientName}`,
    `Enviado: ${formatSoles(fields.sendAmount)}`,
    `Comisión: ${formatSoles(fields.fee)}`,
    `Recibido: ${formatForeign(fields.receiveAmount, fields.currency)}`,
    `Referencia bancaria: ${fields.reference}`,
    `Fecha: ${formatDate(fields.submittedAt)}`,
  ];
}

export async function buildReceiptPdf(fields: ReceiptFields): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const lines = receiptLines(fields);
  page.drawText("Few", { x: 48, y: 780, size: 28, font: bold, color: rgb(0.04, 0.04, 0.04) });
  lines.forEach((line, index) => {
    page.drawText(line, {
      x: 48,
      y: 720 - index * 32,
      size: index === 0 ? 18 : 13,
      font: index === 0 ? bold : regular,
      color: rgb(0.04, 0.04, 0.04),
    });
  });
  return pdf.save();
}
