import { getDb } from "@/lib/db";

export type StoreProduct = {
  id: string;
  category_id: number | null;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  price_iqd: number;
  compare_at_price_iqd: number | null;
  stock_quantity: number;
  sort_order: number;
  image_url: string | null;
};

export type StoreCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

export async function getActiveCategories(): Promise<StoreCategory[]> {
  const db = getDb();
  const result = await db.prepare(
    "SELECT id, name, slug, description, sort_order FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC"
  ).all<StoreCategory>();
  return result.results;
}

export async function getActiveProducts(search = ""): Promise<StoreProduct[]> {
  const db = getDb();
  const term = search.trim();
  const result = await db.prepare(`
    SELECT p.id, p.category_id, p.name, p.slug, p.summary, p.description,
           p.price_iqd, p.compare_at_price_iqd, p.stock_quantity, p.sort_order,
           (SELECT pi.image_url FROM product_images pi
             WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_url
      FROM products p
     WHERE p.is_active = 1
       AND (? = '' OR p.name LIKE ? OR COALESCE(p.summary, '') LIKE ?)
     ORDER BY p.sort_order ASC, p.created_at DESC
     LIMIT 100
  `).bind(term, `%${term}%`, `%${term}%`).all<StoreProduct>();
  return result.results;
}

export async function getProductBySlug(slug: string): Promise<StoreProduct | null> {
  const db = getDb();
  return db.prepare(`
    SELECT p.id, p.category_id, p.name, p.slug, p.summary, p.description,
           p.price_iqd, p.compare_at_price_iqd, p.stock_quantity, p.sort_order,
           (SELECT pi.image_url FROM product_images pi
             WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS image_url
      FROM products p WHERE p.slug = ? AND p.is_active = 1 LIMIT 1
  `).bind(slug).first<StoreProduct>();
}
