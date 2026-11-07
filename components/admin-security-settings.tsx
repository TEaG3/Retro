"use client";

import { useEffect, useState } from "react";

export function AdminSecuritySettings() {
  const [number,setNumber]=useState("");
  const [email,setEmail]=useState("");
  const [code,setCode]=useState("");
  const [admins,setAdmins]=useState<{email:string;role:string;is_active:number}[]>([]);
  const [fullAdmin,setFullAdmin]=useState(false);
  const [owner,setOwner]=useState(false);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    void (async()=>{
      const settings=await fetch("/api/admin/settings",{cache:"no-store"});
      if(settings.ok){const d=await settings.json();setNumber(d.whatsapp_number??"");setFullAdmin(true);}
      const list=await fetch("/api/admin/admins",{cache:"no-store"});
      if(list.ok){const d=await list.json();setAdmins(d.admins??[]);setOwner(true);}
    })();
  },[]);

  async function saveContact(){
    setBusy(true);setMessage("");
    try{const r=await fetch("/api/admin/settings",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({whatsapp_number:number})});const d=await r.json();setMessage(r.ok?"تم حفظ رقم واتساب.":d.error??"تعذر الحفظ.");}
    catch{setMessage("تعذر الاتصال بالخادم.");}finally{setBusy(false);}
  }
  async function addAdmin(){
    setBusy(true);setMessage("");
    try{const r=await fetch("/api/admin/admins",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email})});const d=await r.json();setMessage(r.ok?"تمت إضافة المسؤول بصلاحية مدير.":d.error??"تعذر الإضافة.");if(r.ok){setEmail("");const list=await fetch("/api/admin/admins");if(list.ok)setAdmins((await list.json()).admins??[]);}}
    catch{setMessage("تعذر الاتصال بالخادم.");}finally{setBusy(false);}
  }
  async function issueCode(){
    setBusy(true);setMessage("");
    try{const r=await fetch("/api/admin/admins/code",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email})});const d=await r.json();setMessage(r.ok?"أرسلنا رمزاً إلى بريد المالك.":d.error??"تعذر إرسال الرمز.");}
    catch{setMessage("تعذر الاتصال بالخادم.");}finally{setBusy(false);}
  }
  async function elevate(){
    setBusy(true);setMessage("");
    try{const r=await fetch("/api/admin/admins/verify",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,code})});const d=await r.json();setMessage(r.ok?d.message:d.error??"تعذر التحقق.");if(r.ok){setCode("");const list=await fetch("/api/admin/admins");if(list.ok)setAdmins((await list.json()).admins??[]);}}
    catch{setMessage("تعذر الاتصال بالخادم.");}finally{setBusy(false);}
  }
  async function revoke(target:string){
    if(!confirm("هل تريد إيقاف صلاحية هذا المسؤول؟"))return;
    const r=await fetch("/api/admin/admins?email="+encodeURIComponent(target),{method:"DELETE"});
    setMessage(r.ok?"تم إيقاف صلاحية المسؤول.":"تعذر إيقاف الصلاحية.");
    if(r.ok)setAdmins(items=>items.map(a=>a.email===target?{...a,is_active:0}:a));
  }

  if(!fullAdmin&&!owner)return null;
  return <section className="panel space-y-6 p-6">
    <div><h2 className="text-xl font-bold">إعدادات التواصل والأمان</h2><p className="mt-2 text-sm text-white/50">تظهر بيانات التواصل للعملاء بعد حفظها فقط.</p></div>
    {fullAdmin&&<div className="space-y-3"><label className="block text-sm font-semibold" htmlFor="retro-whatsapp">رقم واتساب المتجر (بالصيغة الدولية)</label><input id="retro-whatsapp" value={number} onChange={e=>setNumber(e.target.value)} placeholder="+9647XXXXXXXXX" dir="ltr" className="w-full rounded-xl border border-white/15 bg-black/20 p-3"/><button disabled={busy} onClick={()=>void saveContact()} className="rounded-xl bg-retro-cyan px-5 py-3 font-bold text-black">حفظ رقم التواصل</button></div>}
    {owner&&<div className="space-y-4 border-t border-white/10 pt-5">
      <h3 className="font-bold">إدارة المسؤول الاحتياطي</h3>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="بريد المسؤول الاحتياطي" dir="ltr" className="rounded-xl border border-white/15 bg-black/20 p-3"/><button disabled={busy||!email} onClick={()=>void addAdmin()} className="rounded-xl border border-white/20 px-4 py-3">إضافة كمدير</button></div>
      <p className="text-xs leading-6 text-white/45">المدير يستطيع إدارة المنتجات والمخزون والطلبات. ترقية المدير إلى مسؤول كامل تتطلب رمزاً يُرسل إلى بريد المالك.</p>
      <div className="flex flex-wrap gap-2"><button disabled={busy||!email} onClick={()=>void issueCode()} className="rounded-xl border border-retro-cyan/40 px-4 py-2 text-sm">إرسال رمز الترقية إلى المالك</button><input value={code} onChange={e=>setCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="رمز 6 أرقام" className="w-36 rounded-xl border border-white/15 bg-black/20 p-2 text-center"/><button disabled={busy||!email||code.length!==6} onClick={()=>void elevate()} className="rounded-xl bg-retro-pink px-4 py-2 text-sm font-bold text-black">تأكيد الترقية</button></div>
      <div className="space-y-2">{admins.map(a=><div key={a.email} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 p-3 text-sm"><span dir="ltr">{a.email}</span><span className="text-white/50">{a.is_active?"نشط":"موقوف"} · {a.role==="full_admin"?"مسؤول كامل":"مدير"}</span><button onClick={()=>void revoke(a.email)} className="text-xs text-red-300">إيقاف</button></div>)}</div>
    </div>}
    {message&&<p role="status" className="rounded-lg bg-white/5 p-3 text-sm">{message}</p>}
  </section>;
}
