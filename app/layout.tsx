import type { Metadata } from "next";
import "./globals.css";
import { StoreHeader } from "@/components/store-header";
import { CartProvider } from "@/components/cart-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { WhatsAppContact } from "@/components/whatsapp-contact";

export const metadata: Metadata = {
  title: "RETRO Store | متجر الإلكترونيات",
  description: "متجر الأجهزة الإلكترونية وأجهزة الريترو وملحقاتها."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <CartProvider>
            <StoreHeader />
            <main>{children}</main>
            <WhatsAppContact />
            <footer className="mt-20 border-t border-white/10 py-8 text-center text-sm text-white/45">
              © {new Date().getFullYear()} RETRO Store — جميع الحقوق محفوظة
            </footer>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
