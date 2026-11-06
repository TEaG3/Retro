import Link from "next/link";
import { ArrowLeft, Cpu, Gamepad2, Headphones, PackageCheck, ShieldCheck, Truck, Wrench } from "lucide-react";

const categories = [
  { title: "أجهزة ريترو", description: "أجهزة الألعاب الكلاسيكية والمحمولة", icon: Gamepad2, color: "text-retro-pink" },
  { title: "ملحقات وقطع غيار", description: "قطع وملحقات للأجهزة الإلكترونية", icon: Wrench, color: "text-retro-cyan" },
  { title: "إلكترونيات عامة", description: "تقنيات وأجهزة للاستخدام اليومي", icon: Cpu, color: "text-retro-yellow" },
  { title: "أدوات ومعدات", description: "معدات وأدوات تقنية مختارة", icon: Headphones, color: "text-purple-300" }
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-retro-pink/15 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-retro-cyan/10 blur-[110px]" />
        <div className="container relative grid min-h-[570px] items-center gap-12 py-20 md:grid-cols-[1.1fr_.9fr]">
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-retro-cyan/30 bg-retro-cyan/5 px-4 py-2 text-xs text-retro-cyan"><span className="h-2 w-2 rounded-full bg-retro-cyan shadow-[0_0_12px_#00e5ff]"/> وجهتك للتقنية والريترو</span>
            <h1 className="max-w-2xl text-5xl font-black leading-[1.25] md:text-7xl">التقنية التي تحبها، <span className="neon-text text-retro-pink">بروح مختلفة.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-9 text-white/55">اكتشف أجهزة الريترو والإلكترونيات والملحقات المختارة بعناية. اطلب بسهولة والدفع عند الاستلام.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#categories" className="flex items-center gap-3 rounded-xl bg-retro-pink px-6 py-4 font-bold text-black hover:brightness-110">تصفح الأقسام <ArrowLeft size={18}/></Link>
              <Link href="/search" className="rounded-xl border border-white/15 px-6 py-4 font-bold hover:border-retro-cyan/60">استكشف المنتجات</Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-7 text-sm text-white/50">
              <span className="flex items-center gap-2"><Truck size={17} className="text-retro-cyan"/> توصيل للعنوان</span>
              <span className="flex items-center gap-2"><ShieldCheck size={17} className="text-retro-pink"/> طلب آمن</span>
              <span className="flex items-center gap-2"><PackageCheck size={17} className="text-retro-yellow"/> الدفع عند الاستلام</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[480px]">
            <div className="absolute inset-8 rounded-full bg-retro-pink/20 blur-[80px]"/>
            <div className="panel relative overflow-hidden p-5 shadow-neon">
              <div className="absolute inset-0 bg-gradient-to-br from-retro-pink/10 via-transparent to-retro-cyan/10"/>
              <div className="relative rounded-2xl border border-white/10 bg-[#0c0a18] p-8">
                <div className="mb-8 flex items-center justify-between text-xs text-white/40"><span>RETRO COLLECTION</span><span className="text-retro-cyan">01 / 04</span></div>
                <div className="mx-auto grid aspect-square max-w-[290px] place-items-center rounded-full border border-retro-cyan/20 bg-[radial-gradient(circle,rgba(0,229,255,.13),transparent_65%)]">
                  <Gamepad2 size={170} strokeWidth={1} className="text-retro-cyan drop-shadow-[0_0_25px_rgba(0,229,255,.5)]"/>
                </div>
                <div className="mt-8 flex items-end justify-between"><div><p className="text-xs text-white/40">DISCOVER THE NEXT LEVEL</p><h2 className="mt-2 text-2xl font-black">RETRO / REDEFINED</h2></div><span className="rounded-lg border border-retro-pink/30 px-3 py-2 text-xs text-retro-pink">NEW ERA</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="container py-24">
        <div className="mb-10 flex items-end justify-between gap-4"><div><p className="text-xs tracking-[.2em] text-retro-cyan">BROWSE COLLECTIONS</p><h2 className="mt-3 text-3xl font-black md:text-4xl">تسوق حسب القسم</h2></div><span className="hidden text-sm text-white/40 md:block">تقنيات تناسب اهتماماتك</span></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({title,description,icon:Icon,color},i)=><Link key={title} href={`/search?category=${i+1}`} className="panel group p-6 transition hover:-translate-y-1 hover:border-retro-pink/40"><div className={`mb-10 grid h-14 w-14 place-items-center rounded-2xl bg-white/5 ${color}`}><Icon size={27}/></div><h3 className="text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-white/45">{description}</p><div className="mt-7 flex items-center justify-between text-xs text-retro-cyan"><span>استكشف القسم</span><ArrowLeft size={16} className="transition group-hover:-translate-x-1"/></div></Link>)}
        </div>
      </section>

      <section id="featured" className="container pb-20">
        <div className="panel flex flex-col items-start justify-between gap-6 overflow-hidden p-8 md:flex-row md:items-center md:p-12">
          <div><p className="text-xs tracking-[.2em] text-retro-pink">COMING INTO FOCUS</p><h2 className="mt-3 text-3xl font-black">قريباً: مجموعة المنتجات</h2><p className="mt-3 max-w-xl leading-8 text-white/50">سيتم ربط هذه الواجهة بقاعدة بيانات Cloudflare D1 لعرض المنتجات والأسعار والمخزون الفعلي.</p></div>
          <Link href="/search" className="whitespace-nowrap rounded-xl border border-retro-cyan/40 px-5 py-3 text-sm text-retro-cyan hover:bg-retro-cyan/10">صفحة المنتجات <ArrowLeft className="mr-2 inline" size={16}/></Link>
        </div>
      </section>
      <section id="about" className="container pb-24 text-center"><h2 className="text-2xl font-black">RETRO STORE</h2><p className="mt-3 text-sm text-white/40">متجر متخصص بالأجهزة الإلكترونية والريترو والملحقات.</p></section>
    </>
  );
}