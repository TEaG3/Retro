import { getDb } from "@/lib/db";
import { requestEmail } from "@/lib/admin";

export async function recordAdminAction(request: Request, action: string, targetId?: string | number, details?: string) {
  try {
    const actor = await requestEmail(request);
    await getDb().prepare(
      "INSERT INTO admin_audit_log(id,actor_email,action,target_email,details) VALUES(?,?,?,?,?)"
    ).bind(
      crypto.randomUUID(),
      actor ?? "verified-admin",
      action.slice(0, 100),
      targetId === undefined ? null : String(targetId).slice(0, 254),
      details?.slice(0, 1000) ?? null
    ).run();
  } catch {
    // Audit logging must never turn a completed store mutation into a reported failure.
  }
}
