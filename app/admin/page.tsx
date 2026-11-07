import { cookies } from "next/headers";
import { verifyStoreAdmin } from "@/lib/admin";
import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminLoginForm } from "@/components/admin-login-form";

export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const jar=await cookies();
  const authorized=await verifyStoreAdmin(jar.get("retro_admin_session")?.value??null);
  if(!authorized) return <section className="grid min-h-[65vh] place-items-center py-10"><AdminLoginForm/></section>;
  return <section className="py-8"><p className="text-xs tracking-[.2em] text-retro-cyan">ADMIN CONSOLE</p><h1 className="mb-8 mt-3 text-3xl font-black">إدارة المتجر</h1><AdminDashboard/></section>;
}
