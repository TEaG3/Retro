import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { isStoreOwnerRequest, requestEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";
const schema = z.object({ email: z.string().email().max(254) });

async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,"0")).join("");
}

export async function POST(request: Request) {
  if (!await isStoreOwnerRequest(request)) return Response.json({error:"غير مصرح"},{status:401});
  const parsed = schema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return Response.json({error:"البريد الإلكتروني غير صحيح."},{status:400});
  const target = parsed.data.email.trim().toLowerCase();
  const actor = await requestEmail(request);
  const env = getCloudflareContext().env as unknown as {OWNER_EMAIL?:string;RESEND_API_KEY?:string};
  const owner = env.OWNER_EMAIL?.trim().toLowerCase();
  if (!owner || !env.RESEND_API_KEY) return Response.json({error:"إعداد بريد المالك أو مفتاح Resend غير مكتمل."},{status:503});
  if (target === owner) return Response.json({error:"لا يمكن ترقية بريد المالك."},{status:400});
  const db = getDb();
  const targetAdmin = await db.prepare("SELECT email,is_active FROM admin_users WHERE email=? COLLATE NOCASE").bind(target).first<{email:string;is_active:number}>();
  if (!targetAdmin?.is_active) return Response.json({error:"أضف المسؤول الاحتياطي أولاً بصلاحية مدير."},{status:404});
  const recent = await db.prepare("SELECT COUNT(*) AS total FROM admin_verification_codes WHERE created_at >= datetime('now','-10 minutes')").first<{total:number}>();
  if ((recent?.total ?? 0) >= 5) return Response.json({error:"تم تجاوز عدد طلبات الرموز. حاول بعد قليل."},{status:429});
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const code = String(((bytes[0]<<24)|(bytes[1]<<16)|(bytes[2]<<8)|bytes[3])>>>0).slice(0,6).padStart(6,"0");
  const codeHash = await hash(code);
  const id = crypto.randomUUID();
  await db.prepare("INSERT INTO admin_verification_codes(id,target_email,code_hash,expires_at,created_by) VALUES(?,?,?,?,?)").bind(id,target,codeHash,Math.floor(Date.now()/1000)+600,actor??owner).run();
  const sent = await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{"Authorization":`Bearer ${env.RESEND_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      from:"RETRO Store <onboarding@resend.dev>",
      to:[owner],
      subject:"رمز تأكيد ترقية مسؤول RETRO",
      html:`<div dir="rtl" style="font-family:Arial,sans-serif"><h2>تأكيد ترقية مسؤول RETRO</h2><p>طلب ترقية حساب المسؤول:</p><p><b>${target.replace(/[&<>"]/g,"")}</b></p><p>رمز التأكيد:</p><div style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</div><p>تنتهي صلاحية الرمز خلال 10 دقائق. إذا لم تطلب هذا الإجراء فتجاهل الرسالة.</p></div>`
    })
  });
  if (!sent.ok) {
    await db.prepare("DELETE FROM admin_verification_codes WHERE id=?").bind(id).run();
    return Response.json({error:"تعذر إرسال رسالة التحقق. تحقق من إعداد Resend والبريد المسموح للاختبار."},{status:502});
  }
  return Response.json({ok:true,message:"أرسلنا رمز التأكيد إلى بريد المالك المسجل."});
}
