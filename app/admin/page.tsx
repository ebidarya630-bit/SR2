import {redirect} from "next/navigation";
import {getSession} from "@/lib/auth";
import {first} from "@/lib/db";
import ApplicationReview from "./application-review";
import BrandReview from "./brand-review";
import SupportReview from "./support-review";
export const runtime="nodejs";
export default async function Admin(){
 const user=await getSession();if(!user)redirect("/login");if(user.role!=="admin")redirect("/dashboard");
 const stats=[["Users","users"],["Brands","brands"],["Certification applications","certification_applications"],["Support tickets","support_tickets"],["BSC requests","bsc_code_requests"],["Certificates","certificates"]] as const;
 const counts=await Promise.all(stats.map(async([label,table])=>({label,count:(await first<{n:number}>("SELECT count(*) AS n FROM "+table))?.n??0})));
 return <main className="shell dashboard"><div className="eyebrow">SR Control Center</div><h1>Administrator dashboard</h1><p className="muted">Signed in as {user.email}. Administrative workspace. Infrastructure activation is tracked separately.</p><div className="cards">{counts.map(x=><article className="card" key={x.label}><p>{x.label}</p><h2 style={{fontSize:36,color:"var(--orange)"}}>{x.count}</h2></article>)}</div><BrandReview/><ApplicationReview/><SupportReview/><form action="/api/auth/logout" method="post"><button className="btn secondary">Sign out</button></form></main>;
}
