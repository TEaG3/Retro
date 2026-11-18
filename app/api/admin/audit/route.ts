import { getDb } from "@/lib/db";
import { isStoreFullAdminRequest } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await isStoreFullAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const limit = Math.min(100, Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 50)));
  const rows = await getDb().prepare("SELECT id,actor_email,action,target_email,details,created_at FROM admin_audit_log ORDER BY created_at DESC LIMIT ?").bind(limit).all();
  return Response.json({ entries: rows.results }, { headers: { "Cache-Control": "no-store" } });
}
