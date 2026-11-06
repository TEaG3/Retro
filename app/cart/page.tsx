import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function CartPage() {
  return <section className="container min-h-[65vh] py-20">
    <div className="panel mx-auto max-w-xl p-10 text-center">
      <ShoppingBag size={42} className="mx-auto text-retro-cyan"/>
      <h1 className="mt-5 text-3xl font-black">سلة التسوق</h1>
      <p className="mt-4 leading-8 text-white/50">السلة ستُفعّل مع نظام المنتجات والطلبات في المرحلة التالية.</p>
      <Link href="/search" className="mt-7 inline-block rounded-xl bg-retro-pink px-6 py-3 font-bold text-black">متابعة التسوق</Link>
    </div>
  </section>;
}