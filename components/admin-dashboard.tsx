"use client";

import { useEffect, useState } from "react";

type Product = { id:string; name:string; slug:string; price_iqd:number; stock_quantity:number; is_active:number; image_url?:string|null };
type Order = { id:string; order_number:number; customer_name:string; phone:string; city:string; address:string; total_iqd:number; status:string; created_at:string; items:{product_name:string;quantity:number;line_total_iqd:number}[] };
const money=(n:number)=>new Intl.NumberFormat("ar-IQ",{maximumFractionDigits:0}).format(n)+" د.ع";

export function AdminDashboard() {
  const [products,setProducts]=useState<Product[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  async function refresh() {
    setError("");
    const [p,o]=await Promise.all([fetch("/api/admin/products",{cache:"no-store"}),fetch("/api/admin/orders",{cache:"no-store"})]);
    if(!p.ok||!o.ok){setError("تعذر الوصول إلى بيانات الإدارة. تحقق من إعداد Cloudflare Access.");return;}
    const pd=await p.json(), od=await o.json(); setProducts(pd.products??[]); setOrders(od.orders??[]);
  }
  useEffect(()=>{void refresh();},[]);
  async function createProduct(form:FormData) {
    setBusy(true);setError("");
    const payload={name:form.get("name"),slug:form.get("slug"),price_iqd:Number(form.get("price_iqd")),stock_quantity:Number(form.get("stock_quantity")),summary:form.get("summary")||null,image_url:form.get("image_url")||null,is_active:form.get("is_active")==="on"};
    const response=await fetch("/api/admin/products",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
    const data=await response.json();setBusy(false);
    if(!response.ok){setError(data.error??"تعذر حفظ المنتج");return;}
    (document.getElementById("product-form") as HTMLFormElement|null)?.reset(); await refresh();
  }
  async function changeStatus(id:string,status:string) {
    const response=await fetch("/api/admin/orders",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,status})});
    if(!response.ok){setError("تعذر تحديث حالة الطلب");return;} await refresh();
  }
  return <div className="space-y-10">
    {error&&<p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}
    <section className="panel p-6">
      <h2 className="text-xl font-bold">إضافة منتج</h2>
      <form id="product-form" action={createProduct} className="mt-5 grid gap-3 sm:grid-cols-2">
        <input required name="name" placeholder="اسم المنتج" className="rounded-xl border border-white/10 bg-black/25 p-3"/>
        <input required name="slug" placeholder="رابط مختصر بالإنجليزية" dir="ltr" className="rounded-xl border border-white/10 bg-black/25 p-3"/>
        <input required name="price_iqd" type="number" min="0" placeholder="السعر بالدينار" className="rounded-xl border border-white/10 bg-black/25 p-3"/>
        <input required name="stock_quantity" type="number" min="0" placeholder="الكمية المتوفرة" className="rounded-xl border border-white/10 bg-black/25 p-3"/>
        <input name="image_url" type="url" placeholder="رابط صورة المنتج (اختياري)" dir="ltr" className="rounded-xl border border-white/10 bg-black/25 p-3 sm:col-span-2"/>
        <input name="summary" placeholder="وصف مختصر" className="rounded-xl border border-white/10 bg-black/25 p-3 sm:col-span-2"/>
        <label className="flex items-center gap-2 text-sm text-white/70"><input name="is_active" type="checkbox"/> نشر المنتج في المتجر</label>
        <button disabled={busy} className="rounded-xl bg-retro-pink p-3 font-bold text-black disabled:opacity-50">{busy?"جارٍ الحفظ...":"حفظ المنتج"}</button>
      </form>
    </section>
    <section>
      <h2 className="mb-4 text-xl font-bold">المنتجات والمخزون ({products.length})</h2>
      <div className="panel divide-y divide-white/10">
        {products.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div><strong>{p.name}</strong><p className="mt-1 text-xs text-white/45">{money(p.price_iqd)} · المخزون {p.stock_quantity} · {p.is_active?"منشور":"مسودة"}</p></div>
          <button onClick={async()=>{await fetch("/api/admin/products",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:p.id,is_active:p.is_active!==1})});await refresh();}} className="rounded-lg border border-white/15 px-3 py-2 text-xs">{p.is_active?"إيقاف النشر":"نشر"}</button>
        </div>)}
        {products.length===0&&<p className="p-5 text-sm text-white/45">لا توجد منتجات بعد.</p>}
      </div>
    </section>
    <section>
      <h2 className="mb-4 text-xl font-bold">الطلبات ({orders.length})</h2>
      <div className="space-y-3">
        {orders.map(o=><article key={o.id} className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><strong>طلب #{o.order_number}</strong><p className="mt-1 text-sm text-white/60">{o.customer_name} · {o.phone} · {o.city}</p><p className="mt-1 text-xs text-white/40">{o.address}</p></div><strong className="text-retro-cyan">{money(o.total_iqd)}</strong></div>
          <div className="mt-3 text-xs text-white/50">{o.items.map(i=>`${i.product_name} × ${i.quantity}`).join("، ")}</div>
          <div className="mt-4 flex items-center gap-3"><label className="text-xs text-white/50">حالة الطلب</label><select value={o.status} onChange={e=>void changeStatus(o.id,e.target.value)} className="rounded-lg border border-white/15 bg-[#121024] p-2 text-sm"><option value="pending">قيد الانتظار</option><option value="confirmed">مؤكد</option><option value="preparing">قيد التجهيز</option><option value="shipped">تم الشحن</option><option value="delivered">تم التسليم</option><option value="cancelled">ملغي</option></select></div>
        </article>)}
        {orders.length===0&&<div className="panel p-5 text-sm text-white/45">لا توجد طلبات حتى الآن.</div>}
      </div>
    </section>
  </div>;
}
