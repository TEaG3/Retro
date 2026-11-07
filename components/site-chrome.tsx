"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StoreHeader } from "@/components/store-header";
import { WhatsAppContact } from "@/components/whatsapp-contact";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  return (
    <>
      {!isAdmin && <StoreHeader />}
      {isAdmin ? <div>{children}</div> : <main>{children}</main>}
      {!isAdmin && <WhatsAppContact />}
      {!isAdmin && (
        <footer className="mt-20 border-t border-white/10 py-8 text-center text-sm text-white/45">
          © {new Date().getFullYear()} RETRO Store — جميع الحقوق محفوظة
        </footer>
      )}
    </>
  );
}
