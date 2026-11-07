import { z } from "zod";
import { getDb } from "@/lib/db";
import { isSameOriginAdminMutation, isStoreAdminRequest } from "@/lib/admin";

export const dynamic = "force-dynamic";
const statusSchema = z.object({ id: z.string().min(1), status: z.enum(["pending","confirmed","preparing","shipped","delivered","cancelled"]) });
export async function GET(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const db = getDb();
  const orders = await db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200").all<Record<string,unknown>>();
  const items = await db.prepare("SELECT * FROM order_items ORDER BY id ASC").all<Record<string,unknown>>();
  const byOrder = new Map<string, Record<string,unknown>[]>();
  for (const item of items.results) {
    const key = String(item.order_id);
    byOrder.set(key, [...(byOrder.get(key) ?? []), item]);
  }
  return Response.json({ orders: orders.results.map((order) => ({ ...order, items: byOrder.get(String(order.id)) ?? [] })) });
}
export async function PATCH(request: Request) {
  if (!isSameOriginAdminMutation(request)) return Response.json({ error: "طلب غير صالح." }, { status: 403 });
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "حالة الطلب غير صحيحة." }, { status: 400 });
  const db = getDb();
  const current = await db.prepare("SELECT status FROM orders WHERE id = ?").bind(parsed.data.id).first<{status:string}>();
  if (!current) return Response.json({ error: "الطلب غير موجود." }, { status: 404 });
  if (current.status === "cancelled" && parsed.data.status !== "cancelled") return Response.json({ error: "لا يمكن إعادة فتح طلب ملغى تلقائياً." }, { status: 409 });
  await db.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(parsed.data.status,parsed.data.id).run();
  return Response.json({ ok: true });
}
