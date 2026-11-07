import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { hashVerificationCode } from "@/lib/otp";

export const dynamic = "force-dynamic";
const schema = z.object({ email: z.string().email().max(254) });

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error:"طلب غير صالح."},{status:403});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return Response.json({error:"البريد الإلكتروني غير صحيح."},{status:400});
  const email=parsed.data.email.trim().toLowerCase();
  const env=getCloudflareContext().env as unknown as {OWNER_EMAIL?:string;RESEND_API_KEY?:string;ADMIN_AUTH_SECRET?:string};
  const owner=env.OWNER_EMAIL?.trim().toLowerCase();
  if (!owner || !env.RESEND_API_KEY || !env.ADMIN_AUTH_SECRET || env.ADMIN_AUTH_SECRET.length < 32) return Response.json({error:"إعداد بريد المالك أو أسرار تسجيل الدخول غير مكتمل."},{status:503});
  const isOwner=email===owner;
  if (!isOwner) {
    const admin=await getDb().prepare("SELECT is_active FROM admin_users WHERE email=? COLLATE NOCASE").bind(email).first<{is_active:number}>();
    if (admin?.is_active!==1) return Response.json({error:"هذا البريد غير مخوّل لإدارة المتجر."},{status:403});
  }
  const recent=await getDb().prepare("SELECT COUNT(*) AS total FROM admin_login_codes WHERE target_email=? COLLATE NOCASE AND created_at >= datetime('now','-15 minutes')").bind(email).first<{total:number}>();
  if((recent?.total??0)>=3) return Response.json({error:"تم تجاوز عدد طلبات الرموز. حاول بعد 15 دقيقة."},{status:429});
  const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1_000_000).padStart(6,"0");
  const codeHash=await hashVerificationCode(code,env.ADMIN_AUTH_SECRET);
  const id=crypto.randomUUID();
  await getDb().prepare("INSERT INTO admin_login_codes(id,target_email,code_hash,expires_at) VALUES(?,?,?,?)").bind(id,email,codeHash,Math.floor(Date.now()/1000)+600).run();
  const sent=await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{"Authorization":`Bearer ${env.RESEND_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      from:"RETRO Store <onboarding@resend.dev>",
      to:[email],
      subject:"رمز دخول لوحة إدارة RETRO",
      html:`<div dir="rtl" style="font-family:Arial,sans-serif"><h2>تسجيل الدخول إلى RETRO</h2><p>رمز الدخول الخاص بك:</p><div style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</div><p>تنتهي صلاحية الرمز خلال 10 دقائق. لا تشاركه مع أي شخص.</p></div>`
    })
  });
  if(!sent.ok){
    await getDb().prepare("DELETE FROM admin_login_codes WHERE id=?").bind(id).run();
    return Response.json({error:"تعذر إرسال الرمز. عنوان الإرسال التجريبي في Resend يسمح حالياً بعنوان مالك الحساب فقط؛ لتفعيل بقية المسؤولين يلزم توثيق نطاق الإرسال."},{status:502});
  }
  return Response.json({ok:true,message:"أرسلنا رمز الدخول إلى بريدك إذا كان مسموحاً في إعدادات الإرسال."});
}
