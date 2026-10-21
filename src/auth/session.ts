import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { localSession, localSignIn, localSignOut, localSignUp } from "@/auth/local";
import { getStore } from "@/infra/get-store";
import { createSupabaseServerClient, supabaseConfigured } from "@/infra/supabase";

export type CurrentSession = { userId: string; email: string };

function googleGivenName(metadata: Record<string, unknown> | undefined) {
  if (!metadata) return null;
  const given = metadata.given_name;
  if (typeof given === "string" && given.trim()) return given.trim().split(/\s+/)[0] ?? null;
  const name = metadata.name ?? metadata.full_name;
  if (typeof name === "string" && name.trim()) return name.trim().split(/\s+/)[0] ?? null;
  return null;
}

async function syncSupabaseProfile(userId: string, email: string, given: string | null) {
  const store = await getStore();
  const profile = await store.getProfile(userId);
  if (!profile) {
    await store.insertProfile({
      userId,
      email,
      googleGivenName: given,
      senderName: null,
      dni: null,
      phone: null,
    });
    return;
  }
  if (!profile.googleGivenName && given) {
    await store.updateProfile({ ...profile, googleGivenName: given });
  }
}

export async function getSession(): Promise<CurrentSession | null> {
  if (!supabaseConfigured()) return localSession();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) return null;
  return { userId: user.id, email: user.email };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/entrar");
  return session;
}

export async function signUpWithPassword(email: string, password: string) {
  if (!supabaseConfigured()) return localSignUp(email, password);
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return { error: "Escribe un correo válido." };
  if (password.length < 6) return { error: "La contraseña necesita al menos 6 caracteres." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email: normalized, password });
  if (error) return { error: "No se pudo crear la cuenta. Prueba con otro correo." };
  if (!data.session || !data.user) {
    return { error: "La cuenta quedó creada, pero el correo todavía pide confirmación. Desactívala en Supabase." };
  }
  await syncSupabaseProfile(data.user.id, normalized, null);
  return { error: null };
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabaseConfigured()) return localSignIn(email, password);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user?.email) return { error: "Correo o contraseña incorrectos." };
  await syncSupabaseProfile(data.user.id, data.user.email, googleGivenName(data.user.user_metadata));
  return { error: null };
}

export async function signInWithGoogle() {
  if (!supabaseConfigured()) {
    return { error: "Continuar con Google se activa cuando el proyecto de Supabase está configurado." };
  }
  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) return { error: "No se pudo abrir Google." };
  redirect(data.url);
}

export async function completeGoogleCallback(code: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user?.email) return;
  await syncSupabaseProfile(
    data.user.id,
    data.user.email,
    googleGivenName(data.user.user_metadata),
  );
}

export async function signOut() {
  if (!supabaseConfigured()) {
    await localSignOut();
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
