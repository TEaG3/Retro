import { z } from "zod";
import { getDb } from "@/lib/db";
import { isStoreAdminRequest } from "@/lib/admin";
import { recordAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"])
});

type OrderStatus = z.infer<typeof statusSchema>["status"];
const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};

export async function GET(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const db = getDb();
  const orders = await db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200").all<Record<string, unknown>>();
  const items = await db.prepare("SELECT * FROM order_items ORDER BY id ASC").all<Record<string, unknown>>();
  const byOrder = new Map<string, Record<string, unknown>[]>();
  for (const item of items.results) {
    const key = String(item.order_id);
    byOrder.set(key, [...(byOrder.get(key) ?? []), item]);
  }
  return Response.json({
    orders: orders.results.map((order) => ({
      ...order,
      items: byOrder.get(String(order.id)) ?? []
    }))
  });
}

export async function PATCH(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "حالة الطلب غير صحيحة." }, { status: 400 });

  const { id, status } = parsed.data;
  const db = getDb();
  const current = await db.prepare("SELECT status FROM orders WHERE id = ?").bind(id).first<{ status: OrderStatus }>();
  if (!current) return Response.json({ error: "الطلب غير موجود." }, { status: 404 });

  if (!allowedTransitions[current.status]?.includes(status)) {
    return Response.json({
      error: current.status === "cancelled" || current.status === "delivered"
        ? "هذا الطلب في حالة نهائية ولا يمكن تغييرها."
        : "لا يمكن الانتقال إلى هذه الحالة. اتبع تسلسل تجهيز الطلب أو ألغِه قبل الشحن."
    }, { status: 409 });
  }

  // Compare-and-set prevents two concurrent dashboard updates from applying stale transitions.
  const result = await db.prepare("UPDATE orders SET status = ? WHERE id = ? AND status = ?")
    .bind(status, id, current.status).run();
  if (!result.meta.changes) {
    return Response.json({ error: "تغيرت حالة الطلب للتو. حدّث الصفحة وحاول مجدداً." }, { status: 409 });
  }
  await recordAdminAction(request, "order_status_changed", id, current.status + " -> " + status);
  return Response.json({ ok: true });
}
