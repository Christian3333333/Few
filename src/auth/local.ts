import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getStore } from "@/infra/get-store";

const scrypt = promisify(scryptCb);
const root = path.join(process.cwd(), ".data");
const authPath = path.join(root, "auth.json");
const secretPath = path.join(root, "secret");
const COOKIE = "few_session";

type LocalUser = {
  id: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
};

async function secret() {
  await mkdir(root, { recursive: true });
  try {
    return await readFile(secretPath, "utf8");
  } catch {
    const value = randomBytes(32).toString("base64url");
    await writeFile(secretPath, value);
    return value;
  }
}

async function users(): Promise<LocalUser[]> {
  try {
    return JSON.parse(await readFile(authPath, "utf8")) as LocalUser[];
  } catch {
    return [];
  }
}

async function saveUsers(list: LocalUser[]) {
  await mkdir(root, { recursive: true });
  await writeFile(authPath, JSON.stringify(list));
}

function tokenFor(userId: string, key: string) {
  const mac = createHmac("sha256", key).update(userId).digest("base64url");
  return `${userId}.${mac}`;
}

function userIdFrom(token: string, key: string) {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = createHmac("sha256", key).update(userId).digest("base64url");
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  return userId;
}

async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, tokenFor(userId, await secret()), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function localSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const userId = userIdFrom(token, await secret());
  if (!userId) return null;
  const user = (await users()).find((item) => item.id === userId);
  if (!user) return null;
  return { userId: user.id, email: user.email };
}

export async function localSignUp(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return { error: "Escribe un correo válido." as const };
  if (password.length < 6) return { error: "La contraseña necesita al menos 6 caracteres." as const };
  const list = await users();
  if (list.some((user) => user.email === normalized)) return { error: "Ya existe una cuenta con ese correo." as const };
  const salt = randomBytes(16);
  const hash = (await scrypt(password, salt, 32)) as Buffer;
  const user: LocalUser = {
    id: crypto.randomUUID(),
    email: normalized,
    passwordSalt: salt.toString("base64"),
    passwordHash: hash.toString("base64"),
  };
  list.push(user);
  await saveUsers(list);
  const store = await getStore();
  await store.insertProfile({
    userId: user.id,
    email: user.email,
    googleGivenName: null,
    senderName: null,
    dni: null,
    phone: null,
  });
  await setSession(user.id);
  return { error: null };
}

export async function localSignIn(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const user = (await users()).find((item) => item.email === normalized);
  if (!user) return { error: "Correo o contraseña incorrectos." as const };
  const hash = (await scrypt(password, Buffer.from(user.passwordSalt, "base64"), 32)) as Buffer;
  const expected = Buffer.from(user.passwordHash, "base64");
  if (hash.length !== expected.length || !timingSafeEqual(hash, expected)) {
    return { error: "Correo o contraseña incorrectos." as const };
  }
  await setSession(user.id);
  return { error: null };
}

export async function localSignOut() {
  (await cookies()).delete(COOKIE);
}
