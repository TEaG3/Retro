import Link from "next/link";
import { getActiveCategories, getActiveProducts } from "@/lib/store";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string;category?:string}>}) {
  const params=await searchParams;
  const q=(params.q??"").slice(0,100);
  const [products,categories]=await Promise.all([getActiveProducts(q),getActiveCategories()]);
  const selectedCategory=Number(params.category)||0;
  const visible=selectedCategory?products.filter(p=>p.category_id===selectedCategory):products;
  return <section className="container min-h-[65vh] py-12">
    <p className="text-xs tracking-[.2em] text-retro-cyan">STORE CATALOG</p>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-4xl font-black">المنتجات</h1><p className="mt-3 text-sm text-white/45">ابحث عن أجهزة الريترو والإلكترونيات والملحقات.</p></div><span className="text-sm text-white/45">{visible.length} منتج</span></div>
    <form action="/search" className="panel mt-7 flex flex-col gap-3 p-4 sm:flex-row"><input name="q" defaultValue={q} placeholder="ابحث باسم المنتج..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 p-3"/><button className="rounded-xl bg-retro-cyan px-6 py-3 font-bold text-black">بحث</button></form>
    <div className="my-6 flex flex-wrap gap-2"><Link href="/search" className={`rounded-full border px-4 py-2 text-xs ${!selectedCategory?"border-retro-pink text-retro-pink":"border-white/15 text-white/60"}`}>الكل</Link>{categories.map(c=><Link key={c.id} href={`/search?category=${c.id}`} className={`rounded-full border px-4 py-2 text-xs ${selectedCategory===c.id?"border-retro-pink text-retro-pink":"border-white/15 text-white/60"}`}>{c.name}</Link>)}</div>
    {visible.length?<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="panel grid min-h-56 place-items-center p-8 text-center"><div><h2 className="text-xl font-bold">لا توجد منتجات مطابقة</h2><p className="mt-3 text-sm text-white/45">أضف منتجات من لوحة الإدارة أو غيّر عبارة البحث.</p></div></div>}
  </section>;
}
