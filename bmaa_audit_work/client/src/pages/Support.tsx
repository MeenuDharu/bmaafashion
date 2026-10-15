import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Support() {
  const fetcher = useAuthenticatedFetch(); const [subject,setSubject]=useState(""); const [message,setMessage]=useState(""); const [category,setCategory]=useState("General Support");
  const tickets=useQuery({queryKey:["/api/support/tickets"],queryFn:async()=>{const r=await fetcher("/api/support/tickets");if(!r.ok)throw new Error("Failed");return r.json();}});
  const create=useMutation({mutationFn:async()=>{const r=await fetcher("/api/support/tickets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject,message,category})});if(!r.ok)throw new Error(await r.text());return r.json();},onSuccess:()=>{setSubject("");setMessage("");tickets.refetch();}});
  return <div className="max-w-5xl mx-auto px-4 py-8 space-y-6"><Card><CardHeader><CardTitle>Customer Support</CardTitle></CardHeader><CardContent className="space-y-3"><Input placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)}/><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["General Support","Product Inquiry","Order Issue","Payment","Return / Refund","Delivery"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select><Textarea placeholder="How can we help?" value={message} onChange={e=>setMessage(e.target.value)}/><Button disabled={!subject||!message||create.isPending} onClick={()=>create.mutate()}>Submit Ticket</Button></CardContent></Card><Card><CardHeader><CardTitle>My Tickets</CardTitle></CardHeader><CardContent className="space-y-3">{(tickets.data||[]).map((t:any)=><div key={t.id} className="border rounded p-4"><div className="flex justify-between"><b>{t.subject}</b><Badge>{t.status}</Badge></div><p className="text-sm text-muted-foreground mt-1">{t.category}</p><p className="mt-2 text-sm">{t.message}</p>{t.response&&<div className="mt-3 bg-muted p-3 rounded text-sm"><b>Support:</b> {t.response}</div>}</div>)}</CardContent></Card></div>;
}
