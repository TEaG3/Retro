import Link from "next/link";

export default function AdminLoginPage() {
  return <section className="container grid min-h-[65vh] place-items-center py-16">
    <div className="panel w-full max-w-lg p-8 text-center">
      <p className="text-xs tracking-[.2em] text-retro-cyan">OWNER ACCESS</p>
      <h1 className="mt-3 text-3xl font-black">دخول إدارة المتجر</h1>
      <p className="mt-4 text-sm leading-8 text-white/55">تتم المصادقة عبر Cloudflare Access، ولا توجد حسابات تسجيل للزبائن. بعد تسجيل الدخول ببريد المالك أو المسؤول المعتمد يمكنك إدارة المتجر بحسب صلاحيتك.</p>
      <Link href="/admin" className="mt-7 inline-block rounded-xl bg-retro-pink px-6 py-3 font-bold text-black">فتح لوحة الإدارة</Link>
    </div>
  </section>;
}
