"use client";

import { AdminSecuritySettings } from "@/components/admin-security-settings";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Product = {
  id: string; category_id: number | null; name: string; slug: string; summary: string | null;
  description: string | null; price_iqd: number; compare_at_price_iqd: number | null;
  stock_quantity: number; is_active: number; sort_order: number; image_url: string | null;
};
type Category = { id: number; name: string; slug: string; description: string | null; sort_order: number; is_active: number; product_count: number };
type Order = {
  id: string; order_number: number; customer_name: string; phone: string; city: string; address: string;
  notes: string | null; total_iqd: number; subtotal_iqd: number; delivery_fee_iqd: number; status: string;
  created_at: string; items: { product_name: string; quantity: number; unit_price_iqd: number; line_total_iqd: number }[];
};
type Overview = {
  products: { total: number; active: number }; categories: { total: number; active: number };
  orders: number; deliveredRevenue: number; needsAttention: number; lowStock: number;
  recentOrders: { id: string; order_number: number; customer_name: string; total_iqd: number; status: string; created_at: string }[];
};
type Tab = "overview" | "products" | "categories" | "orders" | "settings" | "audit";
const money = (n: number) => new Intl.NumberFormat("ar-IQ", { maximumFractionDigits: 0 }).format(n) + " د.ع";
const statuses: Record<string, string> = {
  pending: "قيد الانتظار", confirmed: "مؤكد", preparing: "قيد التجهيز",
  shipped: "تم الشحن", delivered: "تم التسليم", cancelled: "ملغي"
};
const emptyProduct = {
  name: "", slug: "", category_id: "", summary: "", description: "", price_iqd: "",
  compare_at_price_iqd: "", stock_quantity: "0", is_active: true, sort_order: "0", image_urls: ""
};

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [audit, setAudit] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "", sort_order: "0", is_active: true });
  const [editingCategory, setEditingCategory] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p, c, o, s] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/admin/categories", { cache: "no-store" }),
        fetch("/api/admin/orders", { cache: "no-store" }),
        fetch("/api/admin/overview", { cache: "no-store" })
      ]);
      const [pd, cd, od, sd] = await Promise.all([readJson(p), readJson(c), readJson(o), readJson(s)]);
      if ([p, c, o, s].some(r => r.status === 401 || r.status === 403)) {
        setError("تعذر التحقق من صلاحيات الإدارة. تأكد من تسجيل الدخول عبر Cloudflare Access.");
        return;
      }
      if (![p, c, o, s].every(r => r.ok)) throw new Error("تعذر تحميل بعض بيانات لوحة الإدارة.");
      setProducts(pd.products ?? []);
      setCategories(cd.categories ?? []);
      setOrders(od.orders ?? []);
      setOverview(sd);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ أثناء تحميل البيانات.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const filteredProducts = useMemo(() => products.filter(p =>
    [p.name, p.slug].some(v => v.toLowerCase().includes(query.toLowerCase()))
  ), [products, query]);
  const filteredOrders = useMemo(() => orders.filter(o =>
    (orderFilter === "all" || o.status === orderFilter) &&
    [o.customer_name, o.phone, String(o.order_number), o.city].some(v => v.toLowerCase().includes(query.toLowerCase()))
  ), [orders, orderFilter, query]);

  function notify(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 3500); }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const image_urls = productForm.image_urls.split(/\n|,/).map(v => v.trim()).filter(Boolean);
    const payload = {
      name: productForm.name, slug: productForm.slug,
      category_id: productForm.category_id ? Number(productForm.category_id) : null,
      summary: productForm.summary || null, description: productForm.description || null,
      price_iqd: Number(productForm.price_iqd), compare_at_price_iqd: productForm.compare_at_price_iqd ? Number(productForm.compare_at_price_iqd) : null,
      stock_quantity: Number(productForm.stock_quantity), is_active: productForm.is_active,
      sort_order: Number(productForm.sort_order), image_urls
    };
    try {
      const response = await fetch("/api/admin/products", {
        method: editingProduct ? "PUT" : "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(editingProduct ? { id: editingProduct, product: payload } : payload)
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error ?? "تعذر حفظ المنتج.");
      setProductForm(emptyProduct); setEditingProduct(null); notify(editingProduct ? "تم تحديث المنتج." : "تمت إضافة المنتج."); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر حفظ المنتج."); }
    finally { setBusy(false); }
  }

  function startEditProduct(p: Product) {
    setEditingProduct(p.id);
    setProductForm({
      name: p.name, slug: p.slug, category_id: p.category_id ? String(p.category_id) : "",
      summary: p.summary ?? "", description: p.description ?? "", price_iqd: String(p.price_iqd),
      compare_at_price_iqd: p.compare_at_price_iqd ? String(p.compare_at_price_iqd) : "",
      stock_quantity: String(p.stock_quantity), is_active: p.is_active === 1,
      sort_order: String(p.sort_order), image_urls: p.image_url ?? ""
    });
    setTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function archiveProduct(id: string) {
    if (!window.confirm("سيتم إخفاء المنتج عن العملاء مع الاحتفاظ بسجلات الطلبات. متابعة؟")) return;
    const r = await fetch("/api/admin/products?id=" + encodeURIComponent(id), { method: "DELETE" });
    const d = await readJson(r);
    if (!r.ok) { setError(d.error ?? "تعذر أرشفة المنتج."); return; }
    notify("تمت أرشفة المنتج."); await refresh();
  }

  async function quickProductUpdate(id: string, patch: Record<string, unknown>) {
    const r = await fetch("/api/admin/products", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
    const d = await readJson(r);
    if (!r.ok) { setError(d.error ?? "تعذر تحديث المنتج."); return; }
    notify("تم حفظ التغيير."); await refresh();
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const payload = { name: categoryForm.name, slug: categoryForm.slug, description: categoryForm.description || null, sort_order: Number(categoryForm.sort_order), is_active: categoryForm.is_active };
    try {
      const r = await fetch("/api/admin/categories", { method: editingCategory ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(editingCategory ? { id: editingCategory, ...payload } : payload) });
      const d = await readJson(r);
      if (!r.ok) throw new Error(d.error ?? "تعذر حفظ التصنيف.");
      setCategoryForm({ name: "", slug: "", description: "", sort_order: "0", is_active: true }); setEditingCategory(null);
      notify(editingCategory ? "تم تحديث التصنيف." : "تم إنشاء التصنيف."); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر حفظ التصنيف."); }
    finally { setBusy(false); }
  }

  async function archiveCategory(id: number) {
    if (!window.confirm("سيتم إيقاف التصنيف وإبقاؤه مرتبطاً بالمنتجات الحالية. متابعة؟")) return;
    const r = await fetch("/api/admin/categories?id=" + id, { method: "DELETE" });
    const d = await readJson(r);
    if (!r.ok) { setError(d.error ?? "تعذر إيقاف التصنيف."); return; }
    notify("تم إيقاف التصنيف."); await refresh();
  }

  async function changeStatus(id: string, status: string) {
    const r = await fetch("/api/admin/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
    const d = await readJson(r);
    if (!r.ok) { setError(d.error ?? "تعذر تحديث حالة الطلب."); return; }
    notify("تم تحديث حالة الطلب."); await refresh();
  }

  async function loadAudit() {
    const r = await fetch("/api/admin/audit?limit=50", { cache: "no-store" });
    const d = await readJson(r);
    if (!r.ok) { setError(d.error ?? "سجل التدقيق متاح للمالك والمسؤول الكامل فقط."); return; }
    setAudit(d.entries ?? []);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "نظرة عامة" }, { id: "products", label: "المنتجات" },
    { id: "categories", label: "التصنيفات" }, { id: "orders", label: "الطلبات" },
    { id: "settings", label: "الإعدادات والأمان" }, { id: "audit", label: "سجل التدقيق" }
  ];

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-xs tracking-[.2em] text-retro-cyan">RETRO CONTROL CENTER</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">مركز إدارة المتجر</h2><p className="mt-2 text-sm text-white/45">إدارة الكتالوج والمخزون والطلبات ومراقبة أداء المتجر.</p></div>
      <button onClick={() => void refresh()} className="rounded-xl border border-white/15 px-4 py-3 text-sm hover:border-retro-cyan/50">↻ تحديث البيانات</button>
    </div>

    <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="أقسام الإدارة">
      {tabs.map(t => <button key={t.id} onClick={() => { setTab(t.id); if (t.id === "audit") void loadAudit(); }} className={`shrink-0 rounded-xl px-4 py-3 text-sm font-bold transition ${tab === t.id ? "bg-retro-cyan text-black" : "border border-white/10 bg-white/[.03] text-white/65 hover:bg-white/[.08]"}`}>{t.label}</button>)}
    </nav>

    {error && <div role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}<button onClick={() => setError("")} className="mr-3 underline">إغلاق</button></div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-200">{notice}</div>}
    {loading && <div className="panel p-6 text-sm text-white/55">جارٍ تحميل بيانات المتجر...</div>}

    {!loading && tab === "overview" && <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          ["إجمالي المنتجات", overview?.products.total ?? products.length, "منشور: " + (overview?.products.active ?? 0)],
          ["التصنيفات", overview?.categories.total ?? categories.length, "نشط: " + (overview?.categories.active ?? 0)],
          ["إجمالي الطلبات", overview?.orders ?? orders.length, "تحتاج متابعة: " + (overview?.needsAttention ?? 0)],
          ["مبيعات الطلبات المسلّمة", money(overview?.deliveredRevenue ?? 0), "مجموع الطلبات المكتملة"],
          ["مخزون منخفض", overview?.lowStock ?? 0, "الكمية 5 أو أقل"],
          ["طلبات قيد المعالجة", overview?.needsAttention ?? 0, "بانتظار الإجراء"]
        ].map(([label,value,sub]) => <article key={String(label)} className="panel p-4 sm:p-5"><p className="text-xs text-white/45">{label}</p><strong className="mt-3 block text-xl font-black text-retro-cyan sm:text-2xl">{value}</strong><p className="mt-2 text-xs text-white/35">{sub}</p></article>)}
      </div>
      <section className="panel p-5">
        <div className="mb-4 flex items-center justify-between"><h3 className="font-bold">أحدث الطلبات</h3><button onClick={() => setTab("orders")} className="text-xs text-retro-cyan">عرض الكل</button></div>
        <div className="divide-y divide-white/10">{(overview?.recentOrders ?? []).map(o => <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><div><strong>#{o.order_number} · {o.customer_name}</strong><p className="mt-1 text-xs text-white/40">{new Date(o.created_at.replace(" ", "T") + (o.created_at.includes("Z") ? "" : "Z")).toLocaleString("ar-IQ")}</p></div><div className="text-left"><strong>{money(o.total_iqd)}</strong><p className="mt-1 text-xs text-white/45">{statuses[o.status] ?? o.status}</p></div></div>)}{!overview?.recentOrders?.length && <p className="py-4 text-sm text-white/45">لا توجد طلبات مسجلة بعد.</p>}</div>
      </section>
    </>}

    {!loading && tab === "products" && <>
      <section className="panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><div><h3 className="text-lg font-bold">{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</h3><p className="mt-1 text-xs text-white/45">الأسعار بالدينار العراقي. يمكن إضافة حتى 8 صور عبر روابط مباشرة.</p></div>{editingProduct && <button onClick={() => { setEditingProduct(null); setProductForm(emptyProduct); }} className="text-xs text-retro-cyan">إلغاء التعديل</button>}</div>
        <form onSubmit={submitProduct} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-white/55">اسم المنتج<input required minLength={2} maxLength={160} value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})} className="admin-input" /></label>
          <label className="space-y-1 text-xs text-white/55">الرابط المختصر (إنجليزي)<input required pattern="[a-z0-9-]+" value={productForm.slug} onChange={e=>setProductForm({...productForm,slug:e.target.value})} dir="ltr" className="admin-input" /></label>
          <label className="space-y-1 text-xs text-white/55">التصنيف<select value={productForm.category_id} onChange={e=>setProductForm({...productForm,category_id:e.target.value})} className="admin-input"><option value="">بلا تصنيف</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="space-y-1 text-xs text-white/55">السعر بالدينار العراقي<input required type="number" min="0" step="1" value={productForm.price_iqd} onChange={e=>setProductForm({...productForm,price_iqd:e.target.value})} className="admin-input" /></label>
          <label className="space-y-1 text-xs text-white/55">سعر قبل التخفيض (اختياري)<input type="number" min="0" step="1" value={productForm.compare_at_price_iqd} onChange={e=>setProductForm({...productForm,compare_at_price_iqd:e.target.value})} className="admin-input" /></label>
          <label className="space-y-1 text-xs text-white/55">الكمية المتوفرة<input required type="number" min="0" step="1" value={productForm.stock_quantity} onChange={e=>setProductForm({...productForm,stock_quantity:e.target.value})} className="admin-input" /></label>
          <label className="space-y-1 text-xs text-white/55">ترتيب العرض<input type="number" min="0" value={productForm.sort_order} onChange={e=>setProductForm({...productForm,sort_order:e.target.value})} className="admin-input" /></label>
          <label className="space-y-1 text-xs text-white/55 sm:col-span-2">وصف مختصر<input maxLength={300} value={productForm.summary} onChange={e=>setProductForm({...productForm,summary:e.target.value})} className="admin-input" /></label>
          <label className="space-y-1 text-xs text-white/55 sm:col-span-2">الوصف الكامل<textarea rows={4} maxLength={10000} value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})} className="admin-input" /></label>
          <label className="space-y-1 text-xs text-white/55 sm:col-span-2">روابط الصور (كل رابط في سطر مستقل)<textarea rows={3} dir="ltr" placeholder="https://..." value={productForm.image_urls} onChange={e=>setProductForm({...productForm,image_urls:e.target.value})} className="admin-input text-left" /></label>
          <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={productForm.is_active} onChange={e=>setProductForm({...productForm,is_active:e.target.checked})} /> نشر المنتج في المتجر</label>
          <button disabled={busy} className="rounded-xl bg-retro-pink px-5 py-3 font-bold text-black disabled:opacity-50">{busy ? "جارٍ الحفظ..." : editingProduct ? "حفظ التعديلات" : "إضافة المنتج"}</button>
        </form>
      </section>
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-lg font-bold">كتالوج المنتجات ({products.length})</h3><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث بالاسم أو الرابط..." className="admin-input sm:max-w-xs" /></div>
        <div className="grid gap-3">{filteredProducts.map(p=><article key={p.id} className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          {p.image_url ? <img src={p.image_url} alt="" className="h-20 w-20 rounded-xl bg-white/5 object-contain p-1" /> : <div className="grid h-20 w-20 place-items-center rounded-xl bg-white/5 text-2xl">▣</div>}
          <div className="min-w-0 flex-1"><strong>{p.name}</strong><p className="mt-1 text-xs text-white/45" dir="ltr">{p.slug}</p><p className="mt-2 text-sm text-retro-cyan">{money(p.price_iqd)} · المخزون: {p.stock_quantity} · {p.is_active ? "منشور" : "مسودة"}</p></div>
          <div className="flex flex-wrap gap-2"><button onClick={()=>startEditProduct(p)} className="rounded-lg border border-white/15 px-3 py-2 text-xs">تعديل التفاصيل</button><button onClick={()=>void quickProductUpdate(p.id,{is_active:p.is_active!==1})} className="rounded-lg border border-white/15 px-3 py-2 text-xs">{p.is_active ? "إيقاف النشر" : "نشر"}</button><button onClick={()=>void archiveProduct(p.id)} className="rounded-lg border border-red-400/25 px-3 py-2 text-xs text-red-300">أرشفة</button></div>
        </article>)}{filteredProducts.length===0&&<div className="panel p-5 text-sm text-white/45">لا توجد منتجات مطابقة.</div>}</div>
      </section>
    </>}

    {!loading && tab === "categories" && <>
      <section className="panel p-5">
        <h3 className="mb-4 text-lg font-bold">{editingCategory ? "تعديل التصنيف" : "إضافة تصنيف"}</h3>
        <form onSubmit={submitCategory} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-white/55">اسم التصنيف<input required minLength={2} value={categoryForm.name} onChange={e=>setCategoryForm({...categoryForm,name:e.target.value})} className="admin-input" /></label>
          <label className="space-y-1 text-xs text-white/55">الرابط المختصر<input required pattern="[a-z0-9-]+" dir="ltr" value={categoryForm.slug} onChange={e=>setCategoryForm({...categoryForm,slug:e.target.value})} className="admin-input" /></label>
          <label className="space-y-1 text-xs text-white/55 sm:col-span-2">الوصف<input value={categoryForm.description} onChange={e=>setCategoryForm({...categoryForm,description:e.target.value})} className="admin-input" /></label>
          <label className="space-y-1 text-xs text-white/55">ترتيب العرض<input type="number" min="0" value={categoryForm.sort_order} onChange={e=>setCategoryForm({...categoryForm,sort_order:e.target.value})} className="admin-input" /></label>
          <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={categoryForm.is_active} onChange={e=>setCategoryForm({...categoryForm,is_active:e.target.checked})} /> تصنيف نشط</label>
          <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="rounded-xl bg-retro-cyan px-5 py-3 font-bold text-black">{editingCategory ? "حفظ التصنيف" : "إضافة التصنيف"}</button>{editingCategory&&<button type="button" onClick={()=>{setEditingCategory(null);setCategoryForm({name:"",slug:"",description:"",sort_order:"0",is_active:true});}} className="rounded-xl border border-white/15 px-5 py-3">إلغاء</button>}</div>
        </form>
      </section>
      <section className="grid gap-3 sm:grid-cols-2">{categories.map(c=><article key={c.id} className="panel p-4"><div className="flex items-start justify-between gap-3"><div><strong>{c.name}</strong><p dir="ltr" className="mt-1 text-xs text-white/40">{c.slug}</p><p className="mt-2 text-xs text-white/50">{c.product_count} منتج · {c.is_active ? "نشط" : "متوقف"} · الترتيب {c.sort_order}</p></div><span className="text-2xl text-retro-cyan">▦</span></div>{c.description&&<p className="mt-3 text-sm text-white/55">{c.description}</p>}<div className="mt-4 flex gap-2"><button onClick={()=>{setEditingCategory(c.id);setCategoryForm({name:c.name,slug:c.slug,description:c.description??"",sort_order:String(c.sort_order),is_active:c.is_active===1});window.scrollTo({top:0,behavior:"smooth"});}} className="rounded-lg border border-white/15 px-3 py-2 text-xs">تعديل</button><button onClick={()=>void archiveCategory(c.id)} className="rounded-lg border border-red-400/25 px-3 py-2 text-xs text-red-300">إيقاف التصنيف</button></div></article>)}</section>
    </>}

    {!loading && tab === "orders" && <>
      <section className="panel p-4">
        <div className="grid gap-3 sm:grid-cols-2"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="بحث برقم الطلب أو الاسم أو الهاتف أو المدينة..." className="admin-input"/><select value={orderFilter} onChange={e=>setOrderFilter(e.target.value)} className="admin-input"><option value="all">كل الحالات</option>{Object.entries(statuses).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
        <p className="mt-3 text-xs text-white/40">يعرض النظام آخر 200 طلب. انتقال الحالة يخضع للتسلسل المسموح، والطلبات المكتملة أو الملغاة حالات نهائية.</p>
      </section>
      <div className="space-y-3">{filteredOrders.map(o=><article key={o.id} className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><strong className="text-lg">طلب #{o.order_number}</strong><p className="mt-1 text-sm text-white/65">{o.customer_name} · <span dir="ltr">{o.phone}</span></p><p className="mt-1 text-xs text-white/45">{o.city} — {o.address}</p>{o.notes&&<p className="mt-2 text-xs text-white/45">ملاحظات: {o.notes}</p>}</div><div className="text-left"><strong className="text-retro-cyan">{money(o.total_iqd)}</strong><p className="mt-1 text-xs text-white/40">{o.created_at}</p></div></div>
        <div className="my-4 divide-y divide-white/10 rounded-xl bg-black/15 px-3">{o.items.map((i,index)=><div key={index} className="flex justify-between gap-3 py-2 text-sm"><span>{i.product_name} × {i.quantity}</span><span className="text-white/55">{money(i.line_total_iqd)}</span></div>)}</div>
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-white/5 px-3 py-1 text-xs">{statuses[o.status] ?? o.status}</span><label className="flex items-center gap-2 text-xs text-white/55">تحديث الحالة<select value={o.status} onChange={e=>void changeStatus(o.id,e.target.value)} className="rounded-lg border border-white/15 bg-[#121024] p-2 text-sm text-white"><option value={o.status}>{statuses[o.status] ?? o.status}</option>{Object.entries(statuses).filter(([k])=>k!==o.status).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div>
      </article>)}{filteredOrders.length===0&&<div className="panel p-5 text-sm text-white/45">لا توجد طلبات مطابقة.</div>}</div>
    </>}

    {!loading && tab === "settings" && <AdminSecuritySettings />}

    {!loading && tab === "audit" && <section className="panel p-5"><div className="mb-4 flex items-center justify-between"><h3 className="font-bold">سجل العمليات الإدارية</h3><button onClick={()=>void loadAudit()} className="text-xs text-retro-cyan">تحديث السجل</button></div>{audit.length ? <div className="space-y-2">{audit.map((entry,index)=><pre key={String(entry.id ?? index)} className="overflow-x-auto rounded-lg bg-black/20 p-3 text-xs text-white/65" dir="ltr">{JSON.stringify(entry,null,2)}</pre>)}</div> : <p className="text-sm text-white/45">لا توجد بيانات ظاهرة أو أن الصلاحية الحالية لا تسمح بعرض سجل التدقيق.</p>}</section>}
  </div>;
}
