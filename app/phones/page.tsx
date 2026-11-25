import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";
type SearchParams=Promise<{q?:string}>;
export default async function Phones({searchParams}:{searchParams:SearchParams}){
 const {q=""}=await searchParams;const query=q.trim().slice(0,80);
 const supabase=await createClient();
 let request=supabase.from("public_certificate_directory").select("sr_code,score,issued_at,expires_at,public_summary,brand_name,manufacturer,model_name,model_number").order("issued_at",{ascending:false}).limit(50);
 if(query){const safe=query.replace(/[,%()]/g," ").replace(/\\s+/g," ").trim();if(safe)request=request.or("sr_code.ilike.%"+safe+"%,model_name.ilike.%"+safe+"%,manufacturer.ilike.%"+safe+"%");}
 const {data:rows,error}=await request;
 if(error)throw new Error("Unable to load the public certificate registry.");
 return <main className="shell dashboard"><Link className="logo" href="/">SR<span>.</span></Link><div className="eyebrow" style={{marginTop:55}}>Public certificate registry</div><h1>Find an SR-certified phone</h1><p className="muted">Search active certificates by phone model, manufacturer or SR code.</p><form method="get" className="card" style={{maxWidth:720,display:"flex",gap:12,flexWrap:"wrap"}}><input name="q" type="search" defaultValue={query} placeholder="e.g. SR-12345 or phone model" maxLength={80} style={{flex:"1 1 260px"}}/><button className="btn">Search registry</button>{query&&<Link className="btn secondary" href="/phones">Clear</Link>}</form>{!rows?.length?<section className="card section"><h2>{query?"No matching active certificates":"No certified devices published yet"}</h2><p className="muted">Only active certificates issued by an administrator appear here.</p></section>:<section className="section"><div className="cards">{rows.map(row=><article className="card" key={row.sr_code}><div className="eyebrow">{row.sr_code}</div><h2>{row.manufacturer} {row.model_name}</h2><p className="muted">Certified brand: {row.brand_name}</p><strong style={{fontSize:32,color:"var(--orange)"}}>{row.score}<small className="muted"> / 100</small></strong>{row.public_summary&&<p>{row.public_summary}</p>}</article>)}</div></section>}</main>;
}
