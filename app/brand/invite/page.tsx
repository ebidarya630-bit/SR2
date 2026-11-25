"use client";
import Link from "next/link";
import {Suspense,useState} from "react";
import {useSearchParams} from "next/navigation";
function Accept(){const params=useSearchParams();const token=params.get("token")||"";const[busy,setBusy]=useState(false);const[msg,setMsg]=useState("");const[error,setError]=useState("");
 async function accept(){setBusy(true);setError("");setMsg("");try{const r=await fetch("/api/brand/invite-claim",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});const d=await r.json();if(!r.ok)throw new Error(d.error);setMsg(d.message);}catch(e){setError(e instanceof Error?e.message:"Unable to accept invitation.");}finally{setBusy(false);}}
 return <main className="shell"><div className="form-wrap"><Link className="logo" href="/">SR<span>.</span></Link><div className="eyebrow" style={{marginTop:32}}>Company team invitation</div><h1>Join a brand workspace</h1><p className="muted">Sign in with the exact email address to which this invitation was issued. Invitations are single-use and expire after seven days.</p>{error&&<p className="error">{error}</p>}{msg&&<p className="success">{msg}</p>}<Link className="btn secondary" href="/login" style={{width:"100%",marginBottom:12}}>Sign in to invited account</Link><button className="btn" onClick={accept} disabled={busy||!token} style={{width:"100%"}}>{busy?"Accepting…":"Accept invitation"}</button></div></main>;
}
export default function BrandInvitePage(){return <Suspense fallback={<main className="shell"><p>Loading invitation…</p></main>}><Accept/></Suspense>;}
