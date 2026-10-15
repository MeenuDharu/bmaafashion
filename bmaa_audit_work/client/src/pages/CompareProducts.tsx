import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CompareProducts(){
 const qc=useQueryClient(); const data=useQuery({queryKey:["/api/compare"],queryFn:async()=>{const r=await fetch("/api/compare",{headers:{"x-session-id":localStorage.getItem("bmaa_session_id")||""}});return r.json();}});
 const remove=useMutation({mutationFn:async(id:string)=>fetch(`/api/compare/${id}`,{method:"DELETE",headers:{"x-session-id":localStorage.getItem("bmaa_session_id")||""}}),onSuccess:()=>qc.invalidateQueries({queryKey:["/api/compare"]})});
 const products=data.data||[]; return <div className="max-w-7xl mx-auto px-4 py-8"><h1 className="text-2xl font-bold mb-6">Compare Products</h1>{products.length===0?<p className="text-muted-foreground">Add products to comparison from the product page.</p>:<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{products.map((p:any)=><Card key={p.id}><CardContent className="p-4 space-y-3"><img src={p.images?.[0]} className="w-full aspect-[3/4] object-cover rounded"/><h2 className="font-semibold">{p.name}</h2><p className="font-bold">₹{p.price}</p><p className="text-sm">Category: {p.category}</p><p className="text-sm">Sizes: {p.size||"Variant sizes"}</p><p className="text-sm">Colors: {p.colors||"Variant colors"}</p><p className="text-sm">Stock: {p.inStock>0?"Available":"Out of stock"}</p><Button variant="outline" onClick={()=>remove.mutate(p.id)}>Remove</Button></CardContent></Card>)}</div>}</div>;
}
