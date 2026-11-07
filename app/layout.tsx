import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteChrome } from "@/components/site-chrome";

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
            <SiteChrome>{children}</SiteChrome>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
