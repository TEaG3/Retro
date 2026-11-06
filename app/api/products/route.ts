import { getActiveProducts } from "@/lib/store";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 100);
  try {
    const products = await getActiveProducts(q);
    return Response.json({ products });
  } catch {
    return Response.json({ error: "تعذر تحميل المنتجات." }, { status: 503 });
  }
}
