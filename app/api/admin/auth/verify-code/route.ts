import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { hashVerificationCode } from "@/lib/otp";
import { adminSessionCookie, adminSessionLifetimeSeconds } from "@/lib/admin";

export const dynamic = "force-dynamic";
const schema=z.object({email:z.string().email().max(254),code:z.string().regex(/^\d{6}$/)});

function sameOrigin(request:Request){
 const origin=request.headers.get("origin");
 if(!origin)return false;
 try{return new URL(origin).origin===new URL(request.url).origin;}catch{return false;}
}

export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:"طلب غير صالح."},{status:403});
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return Response.json({error:"بيانات التحقق غير صحيحة."},{status:400});
 const email=parsed.data.email.trim().toLowerCase();
 const env=getCloudflareContext().env as unknown as {OWNER_EMAIL?:string;ADMIN_AUTH_SECRET?:string};
 if(!env.ADMIN_AUTH_SECRET || env.ADMIN_AUTH_SECRET.length < 32)return Response.json({error:"سر جلسة الإدارة غير مضبوط."},{status:503});
 const owner=env.OWNER_EMAIL?.trim().toLowerCase();
 if(email!==owner){
  const admin=await getDb().prepare("SELECT is_active FROM admin_users WHERE email=? COLLATE NOCASE").bind(email).first<{is_active:number}>();
  if(admin?.is_active!==1)return Response.json({error:"هذا البريد غير مخوّل."},{status:403});
 }
 const row=await getDb().prepare("SELECT id,code_hash,expires_at,attempts FROM admin_login_codes WHERE target_email=? COLLATE NOCASE AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1").bind(email).first<{id:string;code_hash:string;expires_at:number;attempts:number}>();
 if(!row||row.expires_at<Math.floor(Date.now()/1000)||row.attempts>=5)return Response.json({error:"انتهت صلاحية الرمز أو لم يعد صالحاً. اطلب رمزاً جديداً."},{status:400});
 const actual=await hashVerificationCode(parsed.data.code,env.ADMIN_AUTH_SECRET);
 if(actual!==row.code_hash){
  await getDb().prepare("UPDATE admin_login_codes SET attempts=attempts+1 WHERE id=?").bind(row.id).run();
  return Response.json({error:"رمز التحقق غير صحيح."},{status:400});
 }
 const tokenBytes=crypto.getRandomValues(new Uint8Array(32));
 const token=Array.from(tokenBytes,b=>b.toString(16).padStart(2,"0")).join("");
 const sessionId=crypto.randomUUID();
 const tokenHash=await hashVerificationCode(token,env.ADMIN_AUTH_SECRET);
 const expiry=Math.floor(Date.now()/1000)+adminSessionLifetimeSeconds;
 const committed=await getDb().batch([
  getDb().prepare("INSERT INTO admin_sessions(id,email,token_hash,expires_at) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM admin_login_codes WHERE id=? AND consumed_at IS NULL AND expires_at>=? AND attempts<5)").bind(sessionId,email,tokenHash,expiry,row.id,Math.floor(Date.now()/1000)),
  getDb().prepare("UPDATE admin_login_codes SET consumed_at=CURRENT_TIMESTAMP WHERE id=? AND consumed_at IS NULL AND expires_at>=? AND attempts<5").bind(row.id,Math.floor(Date.now()/1000)),
  getDb().prepare("INSERT INTO admin_audit_log(id,actor_email,action,target_email) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM admin_sessions WHERE id=?)").bind(crypto.randomUUID(),email,"admin_login",email,sessionId)
 ]);
 if(committed[0]?.meta.changes!==1 || committed[1]?.meta.changes!==1) return Response.json({error:"تم استخدام الرمز مسبقاً. اطلب رمزاً جديداً."},{status:409});
 const response=Response.json({ok:true});
 response.headers.append("Set-Cookie",adminSessionCookie(sessionId+"."+token,adminSessionLifetimeSeconds));
 response.headers.set("Cache-Control","no-store");
 return response;
}
