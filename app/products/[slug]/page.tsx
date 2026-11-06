import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/store";
import { AddToCartButton } from "@/components/add-to-cart-button";

export const dynamic = "force-dynamic";
const money=(n:number)=>new Intl.NumberFormat("ar-IQ",{maximumFractionDigits:0}).format(n)+" د.ع";
export default async function ProductPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const product=await getProductBySlug(slug);
  if(!product) notFound();
  return <section className="container py-12">
    <Link href="/search" className="text-sm text-retro-cyan">← العودة إلى المنتجات</Link>
    <div className="mt-6 grid gap-8 md:grid-cols-2">
      <div className="panel grid min-h-[320px] place-items-center overflow-hidden bg-white/[.03]">{product.image_url?<img src={product.image_url} alt={product.name} className="max-h-[520px] w-full object-contain p-8"/>:<span className="text-white/30">لا توجد صورة</span>}</div>
      <div className="py-5"><p className="text-xs tracking-[.2em] text-retro-cyan">RETRO STORE</p><h1 className="mt-4 text-3xl font-black">{product.name}</h1>{product.summary&&<p className="mt-4 leading-8 text-white/55">{product.summary}</p>}{product.description&&<p className="mt-4 whitespace-pre-wrap leading-8 text-white/65">{product.description}</p>}<p className="mt-7 text-2xl font-black text-retro-cyan">{money(product.price_iqd)}</p><p className="mt-2 text-sm text-white/45">المتوفر: {product.stock_quantity}</p><div className="mt-7"><AddToCartButton product={{id:product.id,name:product.name,slug:product.slug,price_iqd:product.price_iqd,image_url:product.image_url,stock_quantity:product.stock_quantity}}/></div><p className="mt-6 text-sm text-white/45">الدفع عند الاستلام · لا حاجة لإنشاء حساب</p></div>
    </div>
  </section>;
}
