import {NextResponse} from "next/server";
import {createHash,randomInt,randomUUID,timingSafeEqual} from "node:crypto";
import {db} from "@/lib/db";
export const runtime="nodejs";
function digest(email:string,code:string){return createHash("sha256").update((process.env.SESSION_SECRET||"")+":"+email+":"+code).digest("hex");}
export async function POST(request:Request){
 try{
  const body=await request.json();const email=String(body.email??"").trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:"Enter a valid email address."},{status:400});
  if(db.prepare("SELECT 1 FROM users WHERE email=?").get(email))return NextResponse.json({error:"This email is already registered."},{status:409});
  const recent = db.prepare("SELECT count(*) AS n FROM email_verification_codes WHERE email=? AND purpose='register' AND created_at >= datetime('now','-1 hour')").get(email) as {n:number};
  const last = db.prepare("SELECT created_at FROM email_verification_codes WHERE email=? AND purpose='register' ORDER BY created_at DESC LIMIT 1").get(email) as {created_at:string}|undefined;
  if (recent.n >= 5) return NextResponse.json({error:"Too many verification requests. Try again in an hour."},{status:429});
  if (last && Date.now() - new Date(last.created_at + " UTC").getTime() < 60_000) return NextResponse.json({error:"Please wait one minute before requesting another code."},{status:429});
  const apiKey=process.env.RESEND_API_KEY;const from=process.env.RESEND_FROM;
  if(!apiKey||!from)return NextResponse.json({error:"Email verification is not configured yet. Please try again later."},{status:503});
  const code=String(randomInt(0,1000000)).padStart(6,"0");const expires=new Date(Date.now()+10*60*1000).toISOString();
  db.prepare("UPDATE email_verification_codes SET consumed_at=CURRENT_TIMESTAMP WHERE email=? AND purpose='register' AND consumed_at IS NULL").run(email);
  db.prepare("INSERT INTO email_verification_codes(id,email,purpose,code_hash,expires_at) VALUES(?,?,'register',?,?)").run(randomUUID(),email,digest(email,code),expires);
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({from,to:[email],subject:"Your SR verification code",html:`<div style="font-family:Arial,sans-serif;color:#242321"><h2>Verify your email for SR</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#f47b20">${code}</p><p>This code expires in 10 minutes. If you did not request it, ignore this email.</p></div>`})});
  if(!response.ok){db.prepare("UPDATE email_verification_codes SET consumed_at=CURRENT_TIMESTAMP WHERE email=? AND purpose='register' AND consumed_at IS NULL").run(email);return NextResponse.json({error:"We could not send the verification email. Please try again later."},{status:502});}
  return NextResponse.json({ok:true,message:"A verification code has been sent to your email. It expires in 10 minutes."});
 }catch{return NextResponse.json({error:"Unable to send a verification code."},{status:500});}
}
