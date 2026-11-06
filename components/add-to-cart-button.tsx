"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCart, type CartProduct } from "@/components/cart-provider";

export function AddToCartButton({ product }: { product: CartProduct }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const unavailable = product.stock_quantity < 1;
  return <button type="button" disabled={unavailable} onClick={() => { addItem(product); setAdded(true); window.setTimeout(() => setAdded(false), 1300); }}
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-retro-pink px-4 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">
    {added ? <Check size={17}/> : <ShoppingBag size={17}/>}
    {unavailable ? "نفد المخزون" : added ? "أُضيفت للسلة" : "أضف إلى السلة"}
  </button>;
}
