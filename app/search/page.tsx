import Link from "next/link";
import { Search } from "lucide-react";

export default function SearchPage() {
  return <section className="container min-h-[65vh] py-20">
    <p className="text-xs tracking-[.2em] text-retro-cyan">STORE CATALOG</p>
    <h1 className="mt-3 text-4xl font-black">المنتجات</h1>
    <div className="panel mt-8 flex items-center gap-3 p-4"><Search className="text-retro-cyan"/><span className="text-sm text-white/45">سيتم تفعيل البحث المباشر بعد ربط قاعدة بيانات Supabase.</span></div>
    <Link href="/" className="mt-8 inline-block text-sm text-retro-pink">العودة للرئيسية</Link>
  </section>;
}