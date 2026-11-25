import Link from "next/link";
import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";

export default async function Dashboard(){
 const user=await getSession();if(!user)redirect("/login");if(user.role==="admin")redirect("/admin");
 const supabase=await createClient();
 const [{count:brandCount,error:brandError},{count:ticketCount,error:ticketError}]=await Promise.all([
  supabase.from("brand_members").select("*",{count:"exact",head:true}).eq("user_id",user.id),
  supabase.from("support_tickets").select("*",{count:"exact",head:true}).eq("created_by",user.id),
 ]);
 if(brandError||ticketError)throw new Error("Unable to load your dashboard.");
 return <main className="shell dashboard"><Link className="logo" href="/">SR<span>.</span></Link><h1>Your SR dashboard</h1><p className="muted">Signed in as {user.email} · @{user.username}</p><div className="cards"><article className="card"><h3>Your brands</h3><h2 style={{color:"var(--orange)"}}>{brandCount??0}</h2><p>Brands connected to your account.</p><Link href="/brand">Open brand portal →</Link></article><article className="card"><h3>Support tickets</h3><h2 style={{color:"var(--orange)"}}>{ticketCount??0}</h2><p>Your support requests.</p><Link href="/support">Get support →</Link></article><article className="card"><h3>Public registry</h3><p>Search verified SR certificates.</p><Link href="/phones">Browse phones →</Link></article></div><form action="/api/auth/logout" method="post" style={{marginTop:24}}><button className="btn secondary">Sign out</button></form></main>;
}
