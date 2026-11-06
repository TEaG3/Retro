import type { Metadata } from "next";
import "./globals.css";
import { StoreHeader } from "@/components/store-header";

export const metadata: Metadata = {
  title: "RETRO Store | متجر الإلكترونيات",
  description: "متجر الأجهزة الإلكترونية وأجهزة الريترو وملحقاتها."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <StoreHeader />
        <main>{children}</main>
        <footer className="border-t border-white/10 mt-20 py-8 text-center text-sm text-white/45">
          © {new Date().getFullYear()} RETRO Store — جميع الحقوق محفوظة
        </footer>
      </body>
    </html>
  );
}