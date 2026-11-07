import { z } from "zod";
import { getDb } from "@/lib/db";
import { isStoreFullAdminRequest } from "@/lib/admin";

export const dynamic="force-dynamic";
const schema=z.object({whatsapp_number:z.string().trim().regex(/^\+?[1-9]\d{7,14}$/).or(z.literal(""))});

export async function GET(request:Request){
 if(!await isStoreFullAdminRequest(request)) return Response.json({error:"غير مصرح"},{status:401});
 const row=await getDb().prepare("SELECT setting_value FROM store_settings WHERE setting_key='whatsapp_number'").first<{setting_value:string}>();
 return Response.json({whatsapp_number:row?.setting_value??""});
}
export async function PUT(request:Request){
 if(!await isStoreFullAdminRequest(request)) return Response.json({error:"غير مصرح"},{status:401});
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success) return Response.json({error:"رقم واتساب غير صحيح. استخدم الصيغة الدولية."},{status:400});
 await getDb().prepare("INSERT INTO store_settings(setting_key,setting_value) VALUES('whatsapp_number',?) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_at=CURRENT_TIMESTAMP").bind(parsed.data.whatsapp_number).run();
 return Response.json({ok:true});
}
