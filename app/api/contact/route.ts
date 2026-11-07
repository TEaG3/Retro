import { getDb } from "@/lib/db";
export const dynamic="force-dynamic";
export async function GET(){
 const row=await getDb().prepare("SELECT setting_value FROM store_settings WHERE setting_key='whatsapp_number'").first<{setting_value:string}>();
 return Response.json({whatsapp_number:row?.setting_value??""},{headers:{"Cache-Control":"public, max-age=60"}});
}
