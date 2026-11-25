import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth";
import {db} from "@/lib/db";
import ApplicationReview from "./application-review";
import BrandReview from "./brand-review";
export const runtime="nodejs";
export default async function Admin(){
 const user=await getSession();if(!user)redirect("/login");if(user.role!=="admin")redirect("/dashboard");
 const stats=[["Users","users"],["Brands","brands"],["Certification applications","certification_applications"],["Support tickets","support_tickets"],["BSC requests","bsc_code_requests"],["Certificates","certificates"]] as const;
 const counts=stats.map(([label,table])=>({label,count:(db.prepare("SELECT count(*) n FROM "+table).get() as {n:number}).n}));
 return <main className="shell dashboard"><div className="eyebrow">SR Control Center</div><h1>Administrator dashboard</h1><p className="muted">Signed in as {user.email}. Local SQLite database is active.</p><div className="cards">{counts.map(x=><article className="card" key={x.label}><p>{x.label}</p><h2 style={{fontSize:36,color:"var(--orange)"}}>{x.count}</h2></article>)}</div><BrandReview/><ApplicationReview/><form action="/api/auth/logout" method="post"><button className="btn secondary">Sign out</button></form></main>;
}
