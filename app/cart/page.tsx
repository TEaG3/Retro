"use client";

import Link from "next/link";
import { ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { CheckoutForm } from "@/components/checkout-form";

const money=(n:number)=>new Intl.NumberFormat("ar-IQ",{maximumFractionDigits:0}).format(n)+" د.ع";
export default function CartPage() {
  const {items,count,subtotal,ready,setQuantity,removeItem}=useCart();
  if(!ready)return <section className="container py-20 text-center text-white/50">جارٍ تحميل السلة...</section>;
  return <section className="container min-h-[65vh] py-12">
    <p className="text-xs tracking-[.2em] text-retro-cyan">YOUR ORDER</p><h1 className="mt-3 text-3xl font-black md:text-4xl">سلة التسوق</h1>
    {!items.length?<div className="panel mt-8 grid min-h-72 place-items-center p-8 text-center"><div><ShoppingBag size={42} className="mx-auto text-retro-cyan"/><h2 className="mt-5 text-xl font-bold">سلتك فارغة حالياً</h2><p className="mt-2 text-sm text-white/45">تصفح المنتجات وأضف ما تحتاجه إلى السلة.</p><Link href="/search" className="mt-6 inline-block rounded-xl bg-retro-pink px-5 py-3 font-bold text-black">تصفح المنتجات</Link></div></div>:
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_.85fr]">
      <div className="panel divide-y divide-white/10 p-5 md:p-7">{items.map(item=><article key={item.id} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 py-5 first:pt-0 sm:grid-cols-[112px_minmax(0,1fr)_auto]">
        <div className="grid h-[88px] w-[88px] place-items-center overflow-hidden rounded-xl bg-white/[.04] sm:h-28 sm:w-28">{item.image_url?<img src={item.image_url} alt={item.name} className="h-full w-full object-contain p-2"/>:<ShoppingBag className="text-white/20"/>}</div>
        <div className="min-w-0"><Link href={`/products/${item.slug}`} className="font-bold">{item.name}</Link><p className="mt-2 text-sm text-retro-cyan">{money(item.price_iqd)}</p><div className="mt-3 flex items-center gap-2"><button aria-label="تقليل الكمية" onClick={()=>setQuantity(item.id,item.quantity-1)} className="rounded-lg border border-white/15 p-2"><Minus size={14}/></button><span className="min-w-6 text-center text-sm">{item.quantity}</span><button aria-label="زيادة الكمية" onClick={()=>setQuantity(item.id,item.quantity+1)} disabled={item.quantity>=item.stock_quantity} className="rounded-lg border border-white/15 p-2 disabled:opacity-30"><Plus size={14}/></button><button onClick={()=>removeItem(item.id)} className="mr-2 text-xs text-red-300"><Trash2 size={15}/></button></div></div>
        <strong className="col-span-2 text-left sm:col-span-1">{money(item.price_iqd*item.quantity)}</strong>
      </article>)}</div>
      <aside className="space-y-4"><div className="panel h-fit p-6"><h2 className="text-xl font-bold">ملخص الطلب</h2><div className="mt-5 space-y-3 border-b border-white/10 pb-5 text-sm"><div className="flex justify-between text-white/55"><span>عدد القطع</span><span>{count}</span></div><div className="flex justify-between text-white/55"><span>المجموع الفرعي</span><span>{money(subtotal)}</span></div><div className="flex justify-between text-white/55"><span>التوصيل</span><span>يحدد لاحقاً</span></div></div><div className="mt-5 flex justify-between text-lg font-bold"><span>الإجمالي</span><span className="text-retro-cyan">{money(subtotal)}</span></div><p className="mt-3 text-xs leading-6 text-white/40">الإجمالي لا يشمل أجور التوصيل التي يتم تأكيدها معك.</p></div><CheckoutForm/></aside>
    </div>}
  </section>;
}
