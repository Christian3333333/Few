import { requireSession } from "@/auth/session";
import { DomainError, messageFor } from "@/domain/errors";
import { createOperations } from "@/domain/operations";
import { getStore } from "@/infra/get-store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  try {
    const receipt = await createOperations(await getStore(), { now: () => new Date() }).receipt(session, id);
    return new Response(Buffer.from(receipt.pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="recibo-${receipt.fields.reference}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return new Response(messageFor(error.code), { status: error.code === "not_found" ? 404 : 409 });
    }
    throw error;
  }
}
