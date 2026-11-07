import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { hashVerificationCode } from "@/lib/otp";

type AuthEnv = { OWNER_EMAIL?: string; ADMIN_AUTH_SECRET?: string };
const COOKIE_NAME = "retro_admin_session";
const SESSION_SECONDS = 12 * 60 * 60;

function envAuth(): AuthEnv {
  return getCloudflareContext().env as unknown as AuthEnv;
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) {
      try { return decodeURIComponent(value.join("=")); } catch { return null; }
    }
  }
  return null;
}

export function adminCookieValue(request: Request): string | null {
  return readCookie(request.headers.get("cookie"), COOKIE_NAME);
}

export async function requestEmail(request: Request): Promise<string | null> {
  return verifyAdminSession(adminCookieValue(request));
}

export async function verifyAdminSession(cookieValue: string | null): Promise<string | null> {
  if (!cookieValue) return null;
  const [id, token, extra] = cookieValue.split(".");
  if (!id || !token || extra !== undefined) return null;
  const env = envAuth();
  if (!env.ADMIN_AUTH_SECRET || env.ADMIN_AUTH_SECRET.length < 32) return null;
  try {
    const session = await getDb().prepare(
      "SELECT email,token_hash,expires_at,revoked_at FROM admin_sessions WHERE id=?"
    ).bind(id).first<{email:string;token_hash:string;expires_at:number;revoked_at:string|null}>();
    if (!session || session.revoked_at || session.expires_at < Math.floor(Date.now()/1000)) return null;
    const supplied = await hashVerificationCode(token, env.ADMIN_AUTH_SECRET);
    if (supplied !== session.token_hash) return null;
    const email = session.email.trim().toLowerCase();
    const owner = env.OWNER_EMAIL?.trim().toLowerCase();
    if (owner && email === owner) return email;
    const admin = await getDb().prepare(
      "SELECT is_active FROM admin_users WHERE email=? COLLATE NOCASE"
    ).bind(email).first<{is_active:number}>();
    return admin?.is_active === 1 ? email : null;
  } catch {
    return null;
  }
}

export async function verifyStoreOwner(cookieValue: string | null): Promise<boolean> {
  const email = await verifyAdminSession(cookieValue);
  const owner = envAuth().OWNER_EMAIL?.trim().toLowerCase();
  return !!email && !!owner && email === owner;
}

export async function verifyStoreAdmin(cookieValue: string | null): Promise<boolean> {
  return !!(await verifyAdminSession(cookieValue));
}

export async function verifyStoreFullAdmin(cookieValue: string | null): Promise<boolean> {
  const email = await verifyAdminSession(cookieValue);
  if (!email) return false;
  const owner = envAuth().OWNER_EMAIL?.trim().toLowerCase();
  if (owner && email === owner) return true;
  try {
    const admin = await getDb().prepare(
      "SELECT role,is_active FROM admin_users WHERE email=? COLLATE NOCASE"
    ).bind(email).first<{role:string;is_active:number}>();
    return admin?.is_active === 1 && admin.role === "full_admin";
  } catch {
    return false;
  }
}

export async function isStoreOwnerRequest(request: Request): Promise<boolean> {
  return verifyStoreOwner(adminCookieValue(request));
}

export async function isStoreAdminRequest(request: Request): Promise<boolean> {
  return verifyStoreAdmin(adminCookieValue(request));
}

export async function isStoreFullAdminRequest(request: Request): Promise<boolean> {
  return verifyStoreFullAdmin(adminCookieValue(request));
}

export function isSameOriginAdminMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

export function adminSessionCookie(value: string, maxAge = SESSION_SECONDS): string {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export const adminSessionLifetimeSeconds = SESSION_SECONDS;
