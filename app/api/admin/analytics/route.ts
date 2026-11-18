import { getDb } from "@/lib/db";
import { isStoreAdminRequest } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await isStoreAdminRequest(request)) {
    return Response.json({ error: "غير مصرح" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const db = getDb();
  await db.batch([
    db.prepare("DELETE FROM site_visitors WHERE last_seen_at < datetime('now', '-180 days')"),
    db.prepare("DELETE FROM site_visitor_days WHERE visit_date < date('now', '-365 days')"),
    db.prepare("DELETE FROM site_page_daily WHERE visit_date < date('now', '-365 days')"),
    db.prepare("DELETE FROM site_visitor_page_daily WHERE visit_date < date('now', '-365 days')")
  ]);
  const [today, yesterday, month, viewsToday, pages, visitors] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS total FROM site_visitor_days WHERE visit_date = date('now')").first<{ total: number }>(),
    db.prepare("SELECT COUNT(*) AS total FROM site_visitor_days WHERE visit_date = date('now','-1 day')").first<{ total: number }>(),
    db.prepare("SELECT COUNT(*) AS total FROM site_visitor_days WHERE visit_date >= date('now','-29 days')").first<{ total: number }>(),
    db.prepare("SELECT COALESCE(SUM(views),0) AS total FROM site_page_daily WHERE visit_date = date('now')").first<{ total: number }>(),
    db.prepare(`SELECT p.path, p.views,
      (SELECT COUNT(*) FROM site_visitor_page_daily u WHERE u.visit_date=p.visit_date AND u.path=p.path) AS unique_visitors
      FROM site_page_daily p WHERE p.visit_date=date('now')
      ORDER BY p.views DESC LIMIT 10`).all<{ path: string; views: number; unique_visitors: number }>(),
    db.prepare(`SELECT visitor_id, first_seen_at, last_seen_at, total_page_views, last_path
      FROM site_visitors ORDER BY last_seen_at DESC LIMIT 100`).all<{
        visitor_id: string; first_seen_at: string; last_seen_at: string; total_page_views: number; last_path: string;
      }>()
  ]);

  return Response.json({
    visitorsToday: today?.total ?? 0,
    visitorsYesterday: yesterday?.total ?? 0,
    visitorsLast30Days: month?.total ?? 0,
    pageViewsToday: viewsToday?.total ?? 0,
    popularPages: pages.results,
    recentVisitors: visitors.results.map((visitor) => ({
      ...visitor,
      visitor_label: `زائر-${visitor.visitor_id.slice(0, 8)}`
    }))
  }, { headers: { "Cache-Control": "no-store" } });
}
