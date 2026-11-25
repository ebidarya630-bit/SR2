"use client";
import Link from "next/link";
import {useState} from "react";
export default function Login(){
 const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[error,setError]=useState("");const[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});const d=await r.json();if(!r.ok){setError(d.error||"Unable to sign in.");setBusy(false);return;}window.location.href=d.role==="admin"?"/admin":"/dashboard";}catch{setError("Network error. Please try again.");setBusy(false);}}
 return <main className="shell"><div className="form-wrap"><Link className="logo" href="/">SR<span>.</span></Link><h1>Welcome back</h1><p className="muted">Sign in to your SR account.</p><form onSubmit={submit}><div className="field"><label>Email</label><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div><div className="field"><label>Password</label><input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></div>{error&&<p className="error">{error}</p>}<button className="btn" style={{width:"100%"}} disabled={busy}>{busy?"Signing in…":"Sign in"}</button></form><p className="muted">New to SR? <Link href="/register" style={{color:"var(--orange-dark)"}}>Create an account</Link></p></div></main>;
}
