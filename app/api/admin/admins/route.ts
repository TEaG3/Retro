import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { isStoreOwnerRequest, requestEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";
const schema = z.object({ email: z.string().email().max(254) });

export async function GET(request: Request) {
  if (!await isStoreOwnerRequest(request)) return Response.json({error:"غير مصرح"},{status:401});
  const rows = await getDb().prepare("SELECT email,role,is_active,created_at FROM admin_users ORDER BY created_at DESC").all();
  return Response.json({ admins: rows.results });
}

export async function POST(request: Request) {
  if (!await isStoreOwnerRequest(request)) return Response.json({error:"غير مصرح"},{status:401});
  const parsed = schema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return Response.json({error:"البريد الإلكتروني غير صحيح."},{status:400});
  const email = parsed.data.email.trim().toLowerCase();
  const actor = await requestEmail(request);
  const env = getCloudflareContext().env as unknown as {OWNER_EMAIL?:string};
  if (email === env.OWNER_EMAIL?.trim().toLowerCase()) return Response.json({error:"بريد المالك لا يضاف كمسؤول احتياطي."},{status:400});
  try {
    await getDb().prepare("INSERT INTO admin_users(email,role,is_active) VALUES(?, 'manager', 1) ON CONFLICT(email) DO UPDATE SET is_active=1, updated_at=CURRENT_TIMESTAMP").bind(email).run();
    await getDb().prepare("INSERT INTO admin_audit_log(id,actor_email,action,target_email) VALUES(?,?,?,?)").bind(crypto.randomUUID(),actor??"owner","admin_manager_added",email).run();
    return Response.json({ok:true,email,role:"manager"});
  } catch { return Response.json({error:"تعذر إضافة المسؤول. تحقق من تطبيق ترحيل قاعدة البيانات."},{status:500}); }
}

export async function DELETE(request: Request) {
  if (!await isStoreOwnerRequest(request)) return Response.json({error:"غير مصرح"},{status:401});
  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) return Response.json({error:"البريد مطلوب."},{status:400});
  const actor = await requestEmail(request);
  await getDb().prepare("UPDATE admin_users SET is_active=0, updated_at=CURRENT_TIMESTAMP WHERE email=? COLLATE NOCASE").bind(email).run();
  await getDb().prepare("INSERT INTO admin_audit_log(id,actor_email,action,target_email) VALUES(?,?,?,?)").bind(crypto.randomUUID(),actor??"owner","admin_revoked",email).run();
  return Response.json({ok:true});
}
