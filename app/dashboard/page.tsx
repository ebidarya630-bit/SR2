import Link from "next/link";
import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth";
import {db} from "@/lib/db";
export const runtime="nodejs";
export default async function Dashboard(){
 const user=await getSession();if(!user)redirect("/login");if(user.role==="admin")redirect("/admin");
 const brandCount=(db.prepare("SELECT count(*) n FROM brands WHERE owner_user_id=?").get(user.id) as {n:number}).n;
 const ticketCount=(db.prepare("SELECT count(*) n FROM support_tickets WHERE created_by=?").get(user.id) as {n:number}).n;
 return <main className="shell dashboard"><Link className="logo" href="/">SR<span>.</span></Link><h1>Your SR dashboard</h1><p className="muted">Signed in as {user.email} · @{user.username}</p><div className="cards"><article className="card"><h3>Your brands</h3><h2 style={{color:"var(--orange)"}}>{brandCount}</h2><p>Brands connected to your account.</p><Link href="/brand">Open brand portal →</Link></article><article className="card"><h3>Support tickets</h3><h2 style={{color:"var(--orange)"}}>{ticketCount}</h2><p>Your support requests.</p><Link href="/support">Get support →</Link></article><article className="card"><h3>Public registry</h3><p>Search verified SR certificates.</p><Link href="/phones">Browse phones →</Link></article></div><form action="/api/auth/logout" method="post" style={{marginTop:24}}><button className="btn secondary">Sign out</button></form></main>;
}
