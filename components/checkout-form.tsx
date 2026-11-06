"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";

export function CheckoutForm() {
  const { items, clear } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function submit(formData: FormData) {
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer_name: formData.get("customer_name"),
          phone: formData.get("phone"),
          city: formData.get("city"),
          address: formData.get("address"),
          notes: formData.get("notes"),
          items: items.map((item) => ({ product_id: item.id, quantity: item.quantity }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر إكمال الطلب");
      clear();
      setSuccess(`تم استلام طلبك بنجاح. رقم الطلب: ${data.order_number}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally { setBusy(false); }
  }
  return <form action={submit} className="panel mt-6 space-y-4 p-6">
    <h2 className="text-xl font-bold">بيانات التوصيل</h2>
    <input required name="customer_name" minLength={3} maxLength={100} placeholder="الاسم الكامل" className="w-full rounded-xl border border-white/10 bg-black/25 p-4"/>
    <input required name="phone" minLength={7} maxLength={20} placeholder="رقم الهاتف" className="w-full rounded-xl border border-white/10 bg-black/25 p-4" dir="ltr"/>
    <input required name="city" maxLength={80} placeholder="المحافظة / المدينة" className="w-full rounded-xl border border-white/10 bg-black/25 p-4"/>
    <textarea required name="address" minLength={8} maxLength={300} placeholder="العنوان بالتفصيل" className="min-h-24 w-full rounded-xl border border-white/10 bg-black/25 p-4"/>
    <textarea name="notes" maxLength={500} placeholder="ملاحظات إضافية (اختياري)" className="min-h-20 w-full rounded-xl border border-white/10 bg-black/25 p-4"/>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    {success && <p role="status" className="text-sm text-emerald-300">{success}</p>}
    <button disabled={busy || items.length === 0} className="w-full rounded-xl bg-retro-pink px-5 py-4 font-bold text-black disabled:opacity-40">{busy ? "جارٍ إرسال الطلب..." : "تأكيد الطلب — الدفع عند الاستلام"}</button>
    <p className="text-xs leading-6 text-white/40">لن يتم خصم أي مبلغ إلكترونياً. يتم الدفع عند استلام الطلب. أجور التوصيل يحددها المتجر أو شركة التوصيل.</p>
  </form>;
}
