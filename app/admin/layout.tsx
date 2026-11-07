import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin-logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080711] text-[#f5f3ff]">
      <header className="border-b border-white/10 bg-[#100e1d]">
        <div className="mx-auto flex min-h-16 w-[min(1160px,calc(100%-32px))] items-center justify-between gap-4">
          <Link href="/admin" className="font-black tracking-[.16em]">RETRO <span className="text-retro-cyan">CONTROL</span></Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-retro-cyan/50">العودة إلى المتجر</Link>
            <AdminLogoutButton/>
          </div>
        </div>
      </header>
      <main className="mx-auto w-[min(1160px,calc(100%-32px))] py-8">{children}</main>
      <footer className="border-t border-white/10 py-5 text-center text-xs text-white/35">RETRO Store · لوحة الإدارة الخاصة</footer>
    </div>
  );
}
