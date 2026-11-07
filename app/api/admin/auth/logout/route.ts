import { getDb } from "@/lib/db";
import { adminCookieValue, adminSessionCookie } from "@/lib/admin";

export const dynamic="force-dynamic";

export async function POST(request:Request){
 const origin=request.headers.get("origin");
 try{
  if(!origin||new URL(origin).origin!==new URL(request.url).origin)return Response.json({error:"طلب غير صالح."},{status:403});
 }catch{return Response.json({error:"طلب غير صالح."},{status:403});}
 const value=adminCookieValue(request);
 if(value){
  const id=value.split(".")[0];
  if(id)await getDb().prepare("UPDATE admin_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();
 }
 const response=Response.json({ok:true});
 response.headers.append("Set-Cookie",adminSessionCookie("",0));
 response.headers.set("Cache-Control","no-store");
 return response;
}
