import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const requiredObjects = [
  "categories",
  "products",
  "product_images",
  "orders",
  "order_items",
  "admin_users",
  "admin_verification_codes",
  "store_settings",
  "admin_audit_log",
  "order_items_check_stock",
  "order_items_decrease_stock",
  "cancelled_order_restore_stock",
  "one_active_full_admin_idx"
] as const;

export async function GET() {
  try {
    const result = await getDb()
      .prepare("SELECT name FROM sqlite_master WHERE name IN (?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(...requiredObjects)
      .all<{ name: string }>();

    const present = new Set(result.results.map((row) => row.name));
    const ready = requiredObjects.every((name) => present.has(name));

    if (!ready) {
      return Response.json(
        { ok: false, database: "not_ready" },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    await getDb().prepare("SELECT 1 AS connected").first<{ connected: number }>();

    return Response.json(
      { ok: true, database: "connected" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json(
      { ok: false, database: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
