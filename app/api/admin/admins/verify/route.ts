import { z } from "zod";
import { getDb } from "@/lib/db";
import { isStoreOwnerRequest, requestEmail } from "@/lib/admin";
import { hashVerificationCode } from "@/lib/otp";

export const dynamic = "force-dynamic";
const schema = z.object({ email:z.string().email().max(254), code:z.string().regex(/^\d{6}$/) });

export async function POST(request:Request) {
  if (!await isStoreOwnerRequest(request)) return Response.json({error:"غير مصرح"},{status:401});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return Response.json({error:"بيانات التحقق غير صحيحة."},{status:400});
  const email=parsed.data.email.trim().toLowerCase(), actor=await requestEmail(request), db=getDb();
  const row=await db.prepare("SELECT id,code_hash,expires_at,attempts FROM admin_verification_codes WHERE target_email=? COLLATE NOCASE AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1").bind(email).first<{id:string;code_hash:string;expires_at:number;attempts:number}>();
  if(!row || row.expires_at<Math.floor(Date.now()/1000) || row.attempts>=5) return Response.json({error:"انتهت صلاحية الرمز أو لم يعد صالحاً. اطلب رمزاً جديداً."},{status:400});
  const env = (await import("@opennextjs/cloudflare")).getCloudflareContext().env as unknown as {RESEND_API_KEY?:string};
  if (!env.RESEND_API_KEY) return Response.json({error:"مفتاح التحقق غير مضبوط."},{status:503});
  const supplied=await hashVerificationCode(parsed.data.code, env.RESEND_API_KEY);
  if(supplied!==row.code_hash) {
    await db.prepare("UPDATE admin_verification_codes SET attempts=attempts+1 WHERE id=?").bind(row.id).run();
    return Response.json({error:"رمز التحقق غير صحيح."},{status:400});
  }
  const envOwner=await db.prepare("SELECT email,is_active FROM admin_users WHERE email=? COLLATE NOCASE").bind(email).first<{email:string;is_active:number}>();
  if(!envOwner?.is_active) return Response.json({error:"حساب المسؤول غير موجود أو موقوف."},{status:404});
  await db.batch([
    db.prepare("UPDATE admin_users SET role='manager',updated_at=CURRENT_TIMESTAMP WHERE role='full_admin'"),
    db.prepare("UPDATE admin_users SET role='full_admin',updated_at=CURRENT_TIMESTAMP WHERE email=? COLLATE NOCASE AND is_active=1").bind(email),
    db.prepare("UPDATE admin_verification_codes SET consumed_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.id),
    db.prepare("INSERT INTO admin_audit_log(id,actor_email,action,target_email) VALUES(?,?,?,?)").bind(crypto.randomUUID(),actor??"owner","admin_promoted_full",email)
  ]);
  return Response.json({ok:true,message:"تمت ترقية المسؤول. أصبح مسؤولاً كاملاً واحداً فقط، مع بقاء صلاحيات المالك الحصرية."});
}
