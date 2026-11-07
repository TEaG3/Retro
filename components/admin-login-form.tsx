"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const [email,setEmail]=useState("");
  const [code,setCode]=useState("");
  const [sent,setSent]=useState(false);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const router=useRouter();

  async function requestCode(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");
    try{
      const r=await fetch("/api/admin/auth/request-code",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email})});
      const d=await r.json();
      if(!r.ok){setMessage(d.error??"تعذر إرسال الرمز.");return;}
      setSent(true);setMessage("أرسلنا رمز التحقق إلى بريدك. تنتهي صلاحيته خلال 10 دقائق.");
    }catch{setMessage("تعذر الاتصال بالخادم.");}finally{setBusy(false);}
  }

  async function verifyCode(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");
    try{
      const r=await fetch("/api/admin/auth/verify-code",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,code})});
      const d=await r.json();
      if(!r.ok){setMessage(d.error??"رمز التحقق غير صحيح.");return;}
      router.replace("/admin");router.refresh();
    }catch{setMessage("تعذر الاتصال بالخادم.");}finally{setBusy(false);}
  }

  return <div className="panel w-full max-w-lg p-8">
    <p className="text-xs tracking-[.2em] text-retro-cyan">RETRO PRIVATE ACCESS</p>
    <h1 className="mt-3 text-3xl font-black">دخول إدارة المتجر</h1>
    <p className="mt-4 text-sm leading-8 text-white/55">أدخل بريد المالك أو بريد مسؤول معتمد. سنرسل رمز تحقق صالحاً لمدة 10 دقائق.</p>
    <form onSubmit={requestCode} className="mt-6 space-y-3">
      <label htmlFor="admin-email" className="block text-sm">البريد الإلكتروني</label>
      <input id="admin-email" value={email} onChange={e=>setEmail(e.target.value)} type="email" required autoComplete="email" dir="ltr" className="w-full rounded-xl border border-white/15 bg-black/20 p-3"/>
      <button disabled={busy} className="w-full rounded-xl bg-retro-cyan p-3 font-bold text-black disabled:opacity-50">{busy?"جارٍ الإرسال...":"إرسال رمز الدخول"}</button>
    </form>
    {sent&&<form onSubmit={verifyCode} className="mt-5 space-y-3">
      <label htmlFor="admin-code" className="block text-sm">رمز التحقق المكوّن من 6 أرقام</label>
      <input id="admin-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} required className="w-full rounded-xl border border-white/15 bg-black/20 p-3 text-center text-2xl tracking-[.4em]"/>
      <button disabled={busy||code.length!==6} className="w-full rounded-xl bg-retro-pink p-3 font-bold text-black disabled:opacity-50">{busy?"جارٍ التحقق...":"تأكيد الدخول"}</button>
    </form>}
    {message&&<p role="status" className="mt-4 rounded-lg bg-white/5 p-3 text-sm leading-7">{message}</p>}
    <p className="mt-5 text-xs leading-6 text-white/35">لا تشارك رمز التحقق مع أي شخص. تسجيل دخول العملاء إلى المتجر غير مطلوب.</p>
  </div>;
}
