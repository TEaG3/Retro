"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router=useRouter();
  async function logout(){
    await fetch("/api/admin/auth/logout",{method:"POST"});
    router.replace("/admin/login");
    router.refresh();
  }
  return <button type="button" onClick={()=>void logout()} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-retro-cyan/50">تسجيل الخروج</button>;
}
