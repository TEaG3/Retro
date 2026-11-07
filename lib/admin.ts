import { createRemoteJWKSet, jwtVerify } from "jose";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";

type AdminEnv = { CF_ACCESS_TEAM_DOMAIN?: string; CF_ACCESS_AUD?: string; OWNER_EMAIL?: string };

async function accessEmail(token: string | null): Promise<string | null> {
  if (!token) return null;
  try {
    const env = getCloudflareContext().env as unknown as AdminEnv;
    const team = env.CF_ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const audience = env.CF_ACCESS_AUD;
    if (!team || !audience) return null;
    const issuer = `https://${team}`;
    const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, jwks, { issuer, audience });
    return typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;
  } catch { return null; }
}

export async function requestEmail(request: Request): Promise<string | null> {
  return accessEmail(request.headers.get("cf-access-jwt-assertion"));
}

export async function verifyStoreOwner(token: string | null): Promise<boolean> {
  const email = await accessEmail(token);
  const env = getCloudflareContext().env as unknown as AdminEnv;
  return !!email && !!env.OWNER_EMAIL && email === env.OWNER_EMAIL.trim().toLowerCase();
}

export async function verifyStoreAdmin(token: string | null): Promise<boolean> {
  const email = await accessEmail(token);
  if (!email) return false;
  const env = getCloudflareContext().env as unknown as AdminEnv;
  if (env.OWNER_EMAIL && email === env.OWNER_EMAIL.trim().toLowerCase()) return true;
  try {
    const user = await getDb().prepare("SELECT is_active FROM admin_users WHERE email = ? COLLATE NOCASE").bind(email).first<{is_active:number}>();
    return user?.is_active === 1;
  } catch { return false; }
}

export async function verifyStoreFullAdmin(token: string | null): Promise<boolean> {
  const email = await accessEmail(token);
  if (!email) return false;
  const env = getCloudflareContext().env as unknown as AdminEnv;
  if (env.OWNER_EMAIL && email === env.OWNER_EMAIL.trim().toLowerCase()) return true;
  try {
    const user = await getDb().prepare("SELECT role,is_active FROM admin_users WHERE email = ? COLLATE NOCASE").bind(email).first<{role:string;is_active:number}>();
    return user?.is_active === 1 && user.role === "full_admin";
  } catch { return false; }
}

export const isStoreOwnerRequest = (request: Request) => verifyStoreOwner(request.headers.get("cf-access-jwt-assertion"));
export const isStoreAdminRequest = (request: Request) => verifyStoreAdmin(request.headers.get("cf-access-jwt-assertion"));
export const isStoreFullAdminRequest = (request: Request) => verifyStoreFullAdmin(request.headers.get("cf-access-jwt-assertion"));
