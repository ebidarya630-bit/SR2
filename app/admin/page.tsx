import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
import ApplicationReview from "./application-review";
import BrandReview from "./brand-review";
export const runtime="nodejs";

export default async function Admin(){
 const user=await getSession();if(!user)redirect("/login");if(user.role!=="admin")redirect("/dashboard");
 const supabase=await createClient();
 const stats=[["Users","profiles"],["Brands","brands"],["Certification applications","certification_applications"],["Support tickets","support_tickets"],["BSC requests","bsc_code_requests"],["Certificates","certificates"]] as const;
 const counts=await Promise.all(stats.map(async([label,table])=>{
  const {count,error}=await supabase.from(table).select("*",{count:"exact",head:true});
  if(error)throw new Error("Unable to load administrator statistics.");
  return {label,count:count??0};
 }));
 return <main className="shell dashboard"><div className="eyebrow">SR Control Center</div><h1>Administrator dashboard</h1><p className="muted">Signed in as {user.email}. Supabase PostgreSQL database is active.</p><div className="cards">{counts.map(x=><article className="card" key={x.label}><p>{x.label}</p><h2 style={{fontSize:36,color:"var(--orange)"}}>{x.count}</h2></article>)}</div><BrandReview/><ApplicationReview/><form action="/api/auth/logout" method="post"><button className="btn secondary">Sign out</button></form></main>;
}
