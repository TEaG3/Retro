import Link from "next/link";

export default function AdminLoginPage() {
  return <section className="container grid min-h-[75vh] place-items-center py-16">
    <div className="panel w-full max-w-md p-8">
      <p className="text-xs tracking-[.2em] text-retro-cyan">PRIVATE ACCESS</p>
      <h1 className="mt-3 text-3xl font-black">دخول المالك</h1>
      <p className="mt-4 text-sm leading-7 text-white/50">واجهة تسجيل الدخول ستُربط بـ Supabase Auth. لن يتم إنشاء حسابات للزبائن.</p>
      <Link href="/" className="mt-7 inline-block text-sm text-retro-pink">العودة للمتجر</Link>
    </div>
  </section>;
}