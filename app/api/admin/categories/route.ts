import { z } from "zod";
import { getDb } from "@/lib/db";
import { isStoreAdminRequest } from "@/lib/admin";
import { recordAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
const categorySchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).max(100000).default(0),
  is_active: z.boolean().default(true)
});

export async function GET(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const result = await getDb().prepare(`
    SELECT c.id,c.name,c.slug,c.description,c.sort_order,c.is_active,c.created_at,
      COUNT(p.id) AS product_count
    FROM categories c LEFT JOIN products p ON p.category_id=c.id
    GROUP BY c.id ORDER BY c.sort_order ASC,c.name ASC
  `).all();
  return Response.json({ categories: result.results });
}

export async function POST(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const parsed = categorySchema.omit({ id: true }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "تحقق من اسم التصنيف ورابطه المختصر." }, { status: 400 });
  const c = parsed.data;
  try {
    const result = await getDb().prepare("INSERT INTO categories(name,slug,description,sort_order,is_active) VALUES(?,?,?,?,?)")
      .bind(c.name,c.slug,c.description ?? null,c.sort_order,c.is_active ? 1 : 0).run();
    await recordAdminAction(request, "category_created", result.meta.last_row_id, c.name);
    return Response.json({ ok: true, id: result.meta.last_row_id }, { status: 201 });
  } catch {
    return Response.json({ error: "تعذر إنشاء التصنيف. قد يكون الاسم أو الرابط مستخدماً." }, { status: 409 });
  }
}

export async function PUT(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const parsed = categorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.id) return Response.json({ error: "بيانات التصنيف غير صحيحة." }, { status: 400 });
  const c = parsed.data;
  try {
    const result = await getDb().prepare("UPDATE categories SET name=?,slug=?,description=?,sort_order=?,is_active=? WHERE id=?")
      .bind(c.name,c.slug,c.description ?? null,c.sort_order,c.is_active ? 1 : 0,c.id).run();
    if (!result.meta.changes) return Response.json({ error: "التصنيف غير موجود." }, { status: 404 });
    await recordAdminAction(request, "category_updated", c.id, c.name);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "تعذر تعديل التصنيف. تحقق من عدم تكرار الاسم أو الرابط." }, { status: 409 });
  }
}

export async function DELETE(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return Response.json({ error: "رقم التصنيف غير صحيح." }, { status: 400 });
  const result = await getDb().prepare("UPDATE categories SET is_active=0 WHERE id=?").bind(id).run();
  if (!result.meta.changes) return Response.json({ error: "التصنيف غير موجود." }, { status: 404 });
  await recordAdminAction(request, "category_archived", id);
  return Response.json({ ok: true, archived: true });
}
