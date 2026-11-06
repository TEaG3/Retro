import { z } from "zod";
import { getDb } from "@/lib/db";

const orderSchema = z.object({
  customer_name: z.string().trim().min(3).max(100),
  phone: z.string().trim().min(7).max(20),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(8).max(300),
  notes: z.string().trim().max(500).optional().default(""),
  items: z.array(z.object({ product_id: z.string().min(1).max(100), quantity: z.number().int().min(1).max(20) })).min(1).max(30)
});

type ProductRow = { id:string; name:string; price_iqd:number; stock_quantity:number; is_active:number };

export async function POST(request: Request) {
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "تحقق من بيانات الطلب والكميات." }, { status: 400 });
  const input = parsed.data;
  const db = getDb();
  const unique = new Map<string, number>();
  for (const item of input.items) unique.set(item.product_id, (unique.get(item.product_id) ?? 0) + item.quantity);
  if ([...unique.values()].some((quantity) => quantity > 20)) return Response.json({ error: "الكمية المطلوبة كبيرة جداً." }, { status: 400 });

  const ids = [...unique.keys()];
  const placeholders = ids.map(() => "?").join(",");
  const rows = await db.prepare(`SELECT id,name,price_iqd,stock_quantity,is_active FROM products WHERE id IN (${placeholders})`).bind(...ids).all<ProductRow>();
  const products = new Map(rows.results.map((product) => [product.id, product]));
  let subtotal = 0;
  const lines: { product: ProductRow; quantity: number; total: number }[] = [];
  for (const [id, quantity] of unique) {
    const product = products.get(id);
    if (!product || product.is_active !== 1) return Response.json({ error: "أحد المنتجات لم يعد متاحاً." }, { status: 409 });
    if (product.stock_quantity < quantity) return Response.json({ error: `الكمية المتاحة من ${product.name} هي ${product.stock_quantity} فقط.` }, { status: 409 });
    const total = product.price_iqd * quantity;
    subtotal += total;
    lines.push({ product, quantity, total });
  }
  const orderId = crypto.randomUUID();
  const deliveryFee = 0;
  const statements = [
    db.prepare(`INSERT INTO orders (id,customer_name,phone,city,address,notes,subtotal_iqd,delivery_fee_iqd,total_iqd,status) VALUES (?,?,?,?,?,?,?,?,?,'pending')`)
      .bind(orderId,input.customer_name,input.phone,input.city,input.address,input.notes,subtotal,deliveryFee,subtotal),
    ...lines.map(({product,quantity,total}) => db.prepare(`INSERT INTO order_items (order_id,product_id,product_name,unit_price_iqd,quantity,line_total_iqd) VALUES (?,?,?,?,?,?)`)
      .bind(orderId,product.id,product.name,product.price_iqd,quantity,total))
  ];
  try {
    await db.batch(statements);
    const saved = await db.prepare("SELECT order_number FROM orders WHERE id = ?").bind(orderId).first<{order_number:number}>();
    return Response.json({ ok: true, order_id: orderId, order_number: saved?.order_number, subtotal_iqd: subtotal, delivery_fee_iqd: deliveryFee, total_iqd: subtotal }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("INSUFFICIENT_STOCK")) return Response.json({ error: "نفدت كمية أحد المنتجات أثناء إتمام الطلب. حدّث السلة وحاول مجدداً." }, { status: 409 });
    return Response.json({ error: "تعذر حفظ الطلب حالياً. حاول مرة أخرى." }, { status: 500 });
  }
}
