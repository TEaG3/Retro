"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

export function WhatsAppContact() {
  const [number,setNumber]=useState("");
  useEffect(()=>{void fetch("/api/contact",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(typeof d?.whatsapp_number==="string")setNumber(d.whatsapp_number.replace(/\D/g,""));}).catch(()=>{});},[]);
  if(!number)return null;
  return <a href={`https://wa.me/${number}`} target="_blank" rel="noopener noreferrer" aria-label="تواصل مع المتجر عبر واتساب" className="fixed bottom-5 left-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"><MessageCircle size={26}/></a>;
}
