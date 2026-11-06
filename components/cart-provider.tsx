"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartProduct = {
  id: string;
  name: string;
  slug: string;
  price_iqd: number;
  image_url: string | null;
  stock_quantity: number;
};
type CartLine = CartProduct & { quantity: number };
type CartContextValue = {
  items: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  addItem: (product: CartProduct) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "retro-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) setItems(parsed.filter((x) => x && typeof x.id === "string" && Number.isInteger(x.quantity) && x.quantity > 0));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    ready,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price_iqd * item.quantity, 0),
    addItem: (product) => setItems((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found) return current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock_quantity) } : item);
      return product.stock_quantity > 0 ? [...current, { ...product, quantity: 1 }] : current;
    }),
    setQuantity: (id, quantity) => setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock_quantity)) } : item)),
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    clear: () => setItems([])
  }), [items, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
