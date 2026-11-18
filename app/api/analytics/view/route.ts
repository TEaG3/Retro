import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const visitorCookie = "retro_visitor";
const validVisitorId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safePath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 300) return null;
  if (!value.startsWith("/") || value.startsWith("//") || /[\r\n\\]/.test(value)) return null;
  const path = value.split("?")[0].split("#")[0];
  if (!path || path === "/" || path.startsWith("/admin") || path.startsWith("/api") ||
      path.startsWith("/_next") || path === "/favicon.ico" || path === "/robots.txt" ||
      path === "/sitemap.xml") return path === "/" ? "/" : null;
  return path;
}

function readVisitorId(request: Request): string | null {
  const raw = request.headers.get("cookie") ?? "";
  const match = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(visitorCookie + "="));
  const value = match?.slice(visitorCookie.length + 1);
  return value && validVisitorId.test(value) ? value : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { path?: unknown };
    const path = safePath(body.path);
    if (!path) return Response.json({ ok: false }, { status: 400, headers: { "Cache-Control": "no-store" } });

    const existingId = readVisitorId(request);
    const visitorId = existingId ?? crypto.randomUUID();
    const db = getDb();
    const day = new Date().toISOString().slice(0, 10);
    const statements = [
      db.prepare(`INSERT INTO site_visitors (visitor_id, last_seen_at, total_page_views, last_path)
        VALUES (?, CURRENT_TIMESTAMP, 1, ?)
        ON CONFLICT(visitor_id) DO UPDATE SET
          last_seen_at = CURRENT_TIMESTAMP,
          total_page_views = site_visitors.total_page_views + 1,
          last_path = excluded.last_path`).bind(visitorId, path),
      db.prepare(`INSERT INTO site_visitor_days (visitor_id, visit_date, page_views)
        VALUES (?, ?, 1)
        ON CONFLICT(visitor_id, visit_date) DO UPDATE SET page_views = site_visitor_days.page_views + 1`).bind(visitorId, day),
      db.prepare(`INSERT INTO site_page_daily (visit_date, path, views)
        VALUES (?, ?, 1)
        ON CONFLICT(visit_date, path) DO UPDATE SET views = site_page_daily.views + 1`).bind(day, path),
      db.prepare("INSERT OR IGNORE INTO site_visitor_page_daily (visit_date, path, visitor_id) VALUES (?, ?, ?)").bind(day, path, visitorId)
    ];
    await db.batch(statements);

    const headers = new Headers({ "Cache-Control": "no-store" });
    if (!existingId) headers.append("Set-Cookie", `${visitorCookie}=${visitorId}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
    return Response.json({ ok: true }, { headers });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
