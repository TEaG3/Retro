import Link from "next/link";
import { ImageOff } from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import type { StoreProduct } from "@/lib/store";

const money = (value: number) => new Intl.NumberFormat("ar-IQ", { maximumFractionDigits: 0 }).format(value) + " د.ع";

export function ProductCard({ product }: { product: StoreProduct }) {
  return <article className="panel overflow-hidden">
    <Link href={`/products/${product.slug}`} className="block">
      <div className="grid aspect-square place-items-center overflow-hidden bg-white/[.035]">
        {product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-contain p-5"/> : <ImageOff className="text-white/20" size={42}/>}
      </div>
      <div className="p-4 pb-2">
        <h3 className="line-clamp-1 font-bold">{product.name}</h3>
        {product.summary && <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-white/45">{product.summary}</p>}
        <div className="mt-3 flex items-center gap-2">
          <strong className="text-retro-cyan">{money(product.price_iqd)}</strong>
          {product.compare_at_price_iqd && product.compare_at_price_iqd > product.price_iqd && <del className="text-xs text-white/35">{money(product.compare_at_price_iqd)}</del>}
        </div>
      </div>
    </Link>
    <div className="p-4 pt-2"><AddToCartButton product={{id:product.id,name:product.name,slug:product.slug,price_iqd:product.price_iqd,image_url:product.image_url,stock_quantity:product.stock_quantity}}/></div>
  </article>;
}
