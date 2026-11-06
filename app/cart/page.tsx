import Link from "next/link";
import { ArrowLeft, ShoppingBag, ShieldCheck, Truck } from "lucide-react";

export default function CartPage() {
  return (
    <section className="container min-h-[65vh] py-12 md:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[.2em] text-retro-cyan">YOUR ORDER</p>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">مراجعة الطلب</h1>
          <p className="mt-3 text-sm text-white/50">راجع الأصناف والكميات والأسعار قبل تأكيد الطلب.</p>
        </div>
        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-300">قبل الاعتماد</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.55fr_.85fr]">
        <div className="panel p-6 md:p-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <h2 className="text-xl font-bold">تفاصيل الأصناف</h2>
            <span className="text-xs text-white/40">الأسعار بالدينار العراقي</span>
          </div>
          <div className="grid min-h-64 place-items-center py-12 text-center">
            <div>
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-retro-cyan/20 bg-retro-cyan/5 text-retro-cyan"><ShoppingBag size={34}/></span>
              <h3 className="mt-6 text-xl font-bold">سلتك فارغة حالياً</h3>
              <p className="mt-3 max-w-sm text-sm leading-7 text-white/45">عند إضافة المنتجات ستظهر هنا بصورها الكبيرة وتفاصيل الكمية وسعر الوحدة والإجمالي.</p>
              <Link href="/search" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-retro-pink px-5 py-3 font-bold text-black">استكشف المنتجات <ArrowLeft size={17}/></Link>
            </div>
          </div>
        </div>
        <aside className="panel h-fit p-6 md:p-7">
          <h2 className="text-xl font-bold">ملخص الطلب</h2>
          <div className="mt-6 space-y-4 border-b border-white/10 pb-5 text-sm">
            <div className="flex justify-between text-white/55"><span>عدد الأصناف</span><span>0</span></div>
            <div className="flex justify-between text-white/55"><span>المجموع الفرعي</span><span>0 د.ع</span></div>
            <div className="flex justify-between text-white/55"><span>أجور التوصيل</span><span>تحدد عند التأكيد</span></div>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-retro-cyan/10 p-4">
            <span className="font-bold">الإجمالي الحالي</span><strong className="text-xl text-retro-cyan">0 د.ع</strong>
          </div>
          <div className="mt-6 space-y-3 text-xs text-white/50">
            <p className="flex items-center gap-2"><Truck size={16} className="text-retro-cyan"/> التوصيل إلى العنوان</p>
            <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-retro-pink"/> الدفع عند الاستلام</p>
          </div>
          <button disabled className="mt-7 w-full cursor-not-allowed rounded-xl bg-white/10 px-5 py-4 font-bold text-white/35">تأكيد الطلب</button>
        </aside>
      </div>
    </section>
  );
}
