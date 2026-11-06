import { createRemoteJWKSet, jwtVerify } from "jose";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type AdminEnv = {
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  OWNER_EMAIL?: string;
};

export async function verifyStoreOwner(token: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    const env = getCloudflareContext().env as unknown as AdminEnv;
    const team = env.CF_ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const audience = env.CF_ACCESS_AUD;
    const owner = env.OWNER_EMAIL?.trim().toLowerCase();
    if (!team || !audience || !owner) return false;
    const issuer = `https://${team}`;
    const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, jwks, { issuer, audience });
    return typeof payload.email === "string" && payload.email.toLowerCase() === owner;
  } catch {
    return false;
  }
}

export async function isStoreOwnerRequest(request: Request): Promise<boolean> {
  return verifyStoreOwner(request.headers.get("cf-access-jwt-assertion"));
}
