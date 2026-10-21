"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession, signInWithGoogle, signInWithPassword, signOut, signUpWithPassword } from "@/auth/session";
import { DomainError } from "@/domain/errors";
import { messageFor } from "@/domain/errors";
import { createOperations } from "@/domain/operations";
import { getStore } from "@/infra/get-store";

async function operations() {
  return createOperations(await getStore(), { now: () => new Date() });
}

function fail(error: unknown): { error: string } {
  if (error instanceof DomainError) return { error: messageFor(error.code) };
  throw error;
}

export async function crearCuenta(_state: { error: string } | null, form: FormData) {
  const result = await signUpWithPassword(String(form.get("correo") ?? ""), String(form.get("contrasena") ?? ""));
  if (result.error) return { error: result.error };
  redirect("/inicio");
}

export async function entrar(_state: { error: string } | null, form: FormData) {
  const result = await signInWithPassword(String(form.get("correo") ?? ""), String(form.get("contrasena") ?? ""));
  if (result.error) return { error: result.error };
  redirect("/inicio");
}

export async function entrarConGoogle(_state: { error: string } | null) {
  const result = await signInWithGoogle();
  return { error: result.error };
}

export async function cerrarSesion() {
  await signOut();
  redirect("/entrar");
}

export async function previsualizar(monto: string, pais: string) {
  try {
    const ops = await operations();
    return { ok: true as const, preview: ops.previewQuote({ sendAmount: monto, country: pais }) };
  } catch (error) {
    if (error instanceof DomainError) return { ok: false as const, error: messageFor(error.code) };
    throw error;
  }
}

export async function continuar(_state: { error: string } | null, form: FormData) {
  const session = await requireSession();
  const ops = await operations();
  const destinatario = String(form.get("destinatario") ?? "");
  try {
    const quote = await ops.lockQuote(session, {
      sendAmount: String(form.get("monto") ?? ""),
      country: String(form.get("pais") ?? ""),
      recipientId: destinatario || null,
    });
    const profile = await (await getStore()).getProfile(session.userId);
    const ready = Boolean(profile?.senderName && profile.dni && profile.phone);
    redirect(ready ? `/cotizacion/${quote.id}/destinatario` : `/cotizacion/${quote.id}/remitente`);
  } catch (error) {
    if (error instanceof DomainError) return { error: messageFor(error.code) };
    throw error;
  }
}

export async function guardarRemitente(quoteId: string, _state: { error: string } | null, form: FormData) {
  const session = await requireSession();
  const ops = await operations();
  try {
    await ops.saveSender(session, {
      name: String(form.get("nombre") ?? ""),
      dni: String(form.get("dni") ?? ""),
      phone: String(form.get("celular") ?? ""),
    });
    revalidatePath("/", "layout");
  } catch (error) {
    return fail(error);
  }
  redirect(`/cotizacion/${quoteId}/destinatario`);
}

export async function elegirDestinatario(quoteId: string, _state: { error: string } | null, form: FormData) {
  const session = await requireSession();
  const ops = await operations();
  try {
    await ops.chooseRecipient(session, quoteId, String(form.get("destinatario") ?? ""));
  } catch (error) {
    return fail(error);
  }
  redirect(`/cotizacion/${quoteId}/pago`);
}

export async function crearDestinatario(quoteId: string, _state: { error: string } | null, form: FormData) {
  const session = await requireSession();
  const ops = await operations();
  try {
    await ops.saveRecipient(session, quoteId, {
      name: String(form.get("nombre") ?? ""),
      iban: String(form.get("iban") ?? ""),
    });
  } catch (error) {
    return fail(error);
  }
  redirect(`/cotizacion/${quoteId}/pago`);
}

export async function enviarVoucher(quoteId: string, _state: { error: string } | null, form: FormData) {
  const session = await requireSession();
  const ops = await operations();
  const file = form.get("voucher");
  if (!(file instanceof File)) return { error: messageFor("file_missing") };
  try {
    const transfer = await ops.submitVoucher(session, quoteId, {
      name: file.name,
      type: file.type,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    redirect(`/envio/${transfer.id}`);
  } catch (error) {
    if (error instanceof DomainError && error.code === "expired") redirect("/inicio?aviso=caducada");
    return fail(error);
  }
}
