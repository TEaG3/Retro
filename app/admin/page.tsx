import { headers } from "next/headers";
import { verifyStoreAdmin } from "@/lib/admin";
import { AdminDashboard } from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const h=await headers();
  const authorized=await verifyStoreAdmin(h.get("cf-access-jwt-assertion"));
  if(!authorized) return <section className="container grid min-h-[65vh] place-items-center py-16"><div className="panel max-w-xl p-8 text-center"><h1 className="text-2xl font-black">منطقة إدارة خاصة</h1><p className="mt-4 leading-8 text-white/55">هذه الصفحة متاحة لمالك المتجر فقط. فعّل تطبيق Cloudflare Access لهذا المسار، واضبط متغيرات CF_ACCESS_TEAM_DOMAIN وCF_ACCESS_AUD وOWNER_EMAIL في إعدادات Worker.</p></div></section>;
  return <section className="container py-12"><p className="text-xs tracking-[.2em] text-retro-cyan">OWNER CONSOLE</p><h1 className="mb-8 mt-3 text-3xl font-black">إدارة المتجر</h1><AdminDashboard/></section>;
}
