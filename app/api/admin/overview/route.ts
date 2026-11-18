import { getDb } from "@/lib/db";
import { isStoreAdminRequest } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const db = getDb();
  const [products, categories, orders, revenue, pending, lowStock, recent] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN is_active=1 THEN 1 ELSE 0 END) AS active FROM products").first<{total:number;active:number}>(),
    db.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN is_active=1 THEN 1 ELSE 0 END) AS active FROM categories").first<{total:number;active:number}>(),
    db.prepare("SELECT COUNT(*) AS total FROM orders").first<{total:number}>(),
    db.prepare("SELECT COALESCE(SUM(total_iqd),0) AS total FROM orders WHERE status='delivered'").first<{total:number}>(),
    db.prepare("SELECT COUNT(*) AS total FROM orders WHERE status IN ('pending','confirmed','preparing')").first<{total:number}>(),
    db.prepare("SELECT COUNT(*) AS total FROM products WHERE is_active=1 AND stock_quantity<=5").first<{total:number}>(),
    db.prepare("SELECT id,order_number,customer_name,total_iqd,status,created_at FROM orders ORDER BY created_at DESC LIMIT 8").all()
  ]);
  return Response.json({
    products: { total: products?.total ?? 0, active: products?.active ?? 0 },
    categories: { total: categories?.total ?? 0, active: categories?.active ?? 0 },
    orders: orders?.total ?? 0,
    deliveredRevenue: revenue?.total ?? 0,
    needsAttention: pending?.total ?? 0,
    lowStock: lowStock?.total ?? 0,
    recentOrders: recent.results
  }, { headers: { "Cache-Control": "no-store" } });
}
