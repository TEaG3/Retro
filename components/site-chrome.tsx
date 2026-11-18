"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { StoreHeader } from "@/components/store-header";
import { WhatsAppContact } from "@/components/whatsapp-contact";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    if (isAdmin || !pathname) return;
    void fetch("/api/analytics/view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true
    }).catch(() => undefined);
  }, [pathname, isAdmin]);
  return (
    <>
      {!isAdmin && <StoreHeader />}
      {isAdmin ? <div>{children}</div> : <main>{children}</main>}
      {!isAdmin && <WhatsAppContact />}
      {!isAdmin && (
        <footer className="mt-20 border-t border-white/10 py-8 text-center text-sm text-white/45">
          © {new Date().getFullYear()} RETRO Store — جميع الحقوق محفوظة · نستخدم إحصاءات زيارة مجهولة لتحسين المتجر
        </footer>
      )}
    </>
  );
}
