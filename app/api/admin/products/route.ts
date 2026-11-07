import { z } from "zod";
import { getDb } from "@/lib/db";
import { isStoreAdminRequest } from "@/lib/admin";

export const dynamic = "force-dynamic";
const productSchema = z.object({
  id: z.string().max(100).optional(),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9-]+$/),
  category_id: z.number().int().positive().nullable().optional(),
  summary: z.string().max(300).nullable().optional(),
  description: z.string().max(10000).nullable().optional(),
  price_iqd: z.number().int().nonnegative(),
  compare_at_price_iqd: z.number().int().nonnegative().nullable().optional(),
  stock_quantity: z.number().int().nonnegative(),
  is_active: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  image_url: z.string().url().max(2000).nullable().optional()
});
export async function GET(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const result = await getDb().prepare(`SELECT p.*, (SELECT image_url FROM product_images i WHERE i.product_id=p.id ORDER BY sort_order,id LIMIT 1) image_url FROM products p ORDER BY sort_order,created_at DESC`).all();
  return Response.json({ products: result.results });
}
export async function POST(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "بيانات المنتج غير مكتملة أو غير صحيحة." }, { status: 400 });
  const p = parsed.data, id = p.id || crypto.randomUUID(), db = getDb();
  try {
    await db.batch([
      db.prepare(`INSERT INTO products (id,category_id,name,slug,summary,description,price_iqd,compare_at_price_iqd,stock_quantity,is_active,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(id,p.category_id ?? null,p.name,p.slug,p.summary ?? null,p.description ?? null,p.price_iqd,p.compare_at_price_iqd ?? null,p.stock_quantity,p.is_active ? 1 : 0,p.sort_order),
      ...(p.image_url ? [db.prepare("INSERT INTO product_images (product_id,image_url,alt_text,sort_order) VALUES (?,?,?,0)").bind(id,p.image_url,p.name)] : [])
    ]);
    return Response.json({ ok: true, id }, { status: 201 });
  } catch {
    return Response.json({ error: "تعذر حفظ المنتج. تحقق من عدم تكرار الرابط المختصر." }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = z.object({
    id: z.string().min(1),
    is_active: z.boolean().optional(),
    stock_quantity: z.number().int().nonnegative().optional(),
    price_iqd: z.number().int().nonnegative().optional(),
    sort_order: z.number().int().optional()
  }).safeParse(body);
  if (!parsed.success) return Response.json({ error: "بيانات التعديل غير صحيحة." }, { status: 400 });
  const p = parsed.data;
  const sets: string[] = [];
  const values: (string | number)[] = [];
  if (p.is_active !== undefined) { sets.push("is_active = ?"); values.push(p.is_active ? 1 : 0); }
  if (p.stock_quantity !== undefined) { sets.push("stock_quantity = ?"); values.push(p.stock_quantity); }
  if (p.price_iqd !== undefined) { sets.push("price_iqd = ?"); values.push(p.price_iqd); }
  if (p.sort_order !== undefined) { sets.push("sort_order = ?"); values.push(p.sort_order); }
  if (!sets.length) return Response.json({ error: "لا توجد تغييرات." }, { status: 400 });
  values.push(p.id);
  const result = await getDb().prepare(`UPDATE products SET ${sets.join(", ")}, updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(...values).run();
  return result.meta.changes ? Response.json({ ok: true }) : Response.json({ error: "المنتج غير موجود." }, { status: 404 });
}
