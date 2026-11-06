import Link from "next/link";
import { Search, ShoppingBag, Zap } from "lucide-react";

export function StoreHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07060e]/90 backdrop-blur-xl">
      <div className="container flex h-[76px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3" aria-label="RETRO Store الرئيسية">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-retro-pink to-purple-700 shadow-neon">
            <Zap size={22} />
          </span>
          <span>
            <strong className="block text-lg tracking-[.12em]">RETRO <span className="text-retro-cyan">STORE</span></strong>
            <small className="text-[10px] text-white/45">TECH • RETRO • ACCESSORIES</small>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-white/65 md:flex">
          <Link href="/#categories" className="hover:text-retro-cyan">الأقسام</Link>
          <Link href="/#featured" className="hover:text-retro-cyan">المنتجات</Link>
          <Link href="/#about" className="hover:text-retro-cyan">عن المتجر</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/search" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 hover:border-retro-cyan/50" aria-label="بحث"><Search size={18}/></Link>
          <Link href="/cart" className="flex h-10 items-center gap-2 rounded-xl bg-retro-pink px-4 text-sm font-bold text-black hover:brightness-110"><ShoppingBag size={17}/> السلة</Link>
        </div>
      </div>
    </header>
  );
}