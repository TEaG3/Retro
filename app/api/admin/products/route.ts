import { z } from "zod";
import { getDb } from "@/lib/db";
import { isStoreAdminRequest } from "@/lib/admin";
import { recordAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9-]+$/),
  category_id: z.number().int().positive().nullable(),
  summary: z.string().trim().max(300).nullable(),
  description: z.string().trim().max(10000).nullable(),
  price_iqd: z.number().int().nonnegative(),
  compare_at_price_iqd: z.number().int().nonnegative().nullable(),
  stock_quantity: z.number().int().nonnegative(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(100000),
  image_urls: z.array(z.string().url().max(2000)).max(8)
}).refine(p => p.compare_at_price_iqd === null || p.compare_at_price_iqd >= p.price_iqd, {
  message: "سعر المقارنة يجب ألا يقل عن السعر الحالي."
});

export async function GET(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const db = getDb();
  const [result, images] = await Promise.all([
    db.prepare("SELECT p.*, (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id=p.id) AS order_line_count FROM products p ORDER BY p.sort_order,p.created_at DESC").all<Record<string, unknown>>(),
    db.prepare("SELECT product_id,image_url,sort_order FROM product_images ORDER BY sort_order,id").all<{product_id:string;image_url:string;sort_order:number}>()
  ]);
  const byProduct = new Map<string, string[]>();
  for (const image of images.results) byProduct.set(image.product_id, [...(byProduct.get(image.product_id) ?? []), image.image_url]);
  return Response.json({ products: result.results.map(product => ({
    ...product,
    image_urls: byProduct.get(String(product.id)) ?? [],
    image_url: byProduct.get(String(product.id))?.[0] ?? null
  })) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "بيانات المنتج غير مكتملة أو غير صحيحة.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const p = parsed.data, id = crypto.randomUUID(), db = getDb();
  try {
    await db.batch([
      db.prepare(`INSERT INTO products (id,category_id,name,slug,summary,description,price_iqd,compare_at_price_iqd,stock_quantity,is_active,sort_order)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(id,p.category_id,p.name,p.slug,p.summary,p.description,p.price_iqd,p.compare_at_price_iqd,p.stock_quantity,p.is_active ? 1 : 0,p.sort_order),
      ...p.image_urls.map((url,index) => db.prepare("INSERT INTO product_images(product_id,image_url,alt_text,sort_order) VALUES(?,?,?,?)").bind(id,url,p.name,index))
    ]);
    await recordAdminAction(request, "product_created", id, p.name);
    return Response.json({ ok: true, id }, { status: 201 });
  } catch {
    return Response.json({ error: "تعذر حفظ المنتج. تحقق من التصنيف وعدم تكرار الرابط المختصر." }, { status: 409 });
  }
}

export async function PUT(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = z.object({ id: z.string().min(1).max(100), product: productSchema }).safeParse(body);
  if (!parsed.success) return Response.json({ error: "بيانات التعديل غير صحيحة.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { id, product: p } = parsed.data, db = getDb();
  const exists = await db.prepare("SELECT id FROM products WHERE id=?").bind(id).first<{id:string}>();
  if (!exists) return Response.json({ error: "المنتج غير موجود." }, { status: 404 });
  try {
    await db.batch([
      db.prepare(`UPDATE products SET category_id=?,name=?,slug=?,summary=?,description=?,price_iqd=?,compare_at_price_iqd=?,stock_quantity=?,is_active=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
        .bind(p.category_id,p.name,p.slug,p.summary,p.description,p.price_iqd,p.compare_at_price_iqd,p.stock_quantity,p.is_active ? 1 : 0,p.sort_order,id),
      db.prepare("DELETE FROM product_images WHERE product_id=?").bind(id),
      ...p.image_urls.map((url,index) => db.prepare("INSERT INTO product_images(product_id,image_url,alt_text,sort_order) VALUES(?,?,?,?)").bind(id,url,p.name,index))
    ]);
    await recordAdminAction(request, "product_updated", id, p.name);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "تعذر تحديث المنتج. تحقق من الرابط والتصنيف." }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const parsed = z.object({
    id: z.string().min(1),
    is_active: z.boolean().optional(),
    stock_quantity: z.number().int().nonnegative().optional(),
    price_iqd: z.number().int().nonnegative().optional(),
    sort_order: z.number().int().min(0).optional()
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "بيانات التعديل غير صحيحة." }, { status: 400 });
  const p = parsed.data, sets: string[] = [], values: (string | number)[] = [];
  if (p.is_active !== undefined) { sets.push("is_active=?"); values.push(p.is_active ? 1 : 0); }
  if (p.stock_quantity !== undefined) { sets.push("stock_quantity=?"); values.push(p.stock_quantity); }
  if (p.price_iqd !== undefined) { sets.push("price_iqd=?"); values.push(p.price_iqd); }
  if (p.sort_order !== undefined) { sets.push("sort_order=?"); values.push(p.sort_order); }
  if (!sets.length) return Response.json({ error: "لا توجد تغييرات." }, { status: 400 });
  values.push(p.id);
  const result = await getDb().prepare(`UPDATE products SET ${sets.join(",")},updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(...values).run();
  if (!result.meta.changes) return Response.json({ error: "المنتج غير موجود." }, { status: 404 });
  await recordAdminAction(request, "product_quick_update", p.id, JSON.stringify(p));
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!await isStoreAdminRequest(request)) return Response.json({ error: "غير مصرح" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "معرّف المنتج مطلوب." }, { status: 400 });
  const result = await getDb().prepare("UPDATE products SET is_active=0,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();
  if (!result.meta.changes) return Response.json({ error: "المنتج غير موجود." }, { status: 404 });
  await recordAdminAction(request, "product_archived", id);
  return Response.json({ ok: true, archived: true });
}
