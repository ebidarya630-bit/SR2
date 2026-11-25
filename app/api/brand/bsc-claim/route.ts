import {NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {getSession} from "@/lib/auth";
import {first,run,batch} from "@/lib/db";
export const runtime="nodejs";
export async function POST(request:Request){
 const user=await getSession();if(!user)return NextResponse.json({error:"Sign in with the brand account before claiming this code."},{status:401});
 try{
  const body=await request.json();const token=String(body.token??"");
  if(token.length<30||token.length>200)return NextResponse.json({error:"Invalid claim link."},{status:400});
  const hash=createHash("sha256").update(token).digest("hex");
  const row=await first<{id:string;brand_id:string;bsc_code:string;expires_at:string;claimed_at:string|null;official_email:string;status:string}>("SELECT i.id,i.brand_id,i.bsc_code,i.expires_at,i.claimed_at,b.official_email,b.status FROM bsc_issuances i JOIN brands b ON b.id=i.brand_id WHERE i.token_hash=?",hash);
  if(!row||row.claimed_at||new Date(row.expires_at).getTime()<Date.now())return NextResponse.json({error:"This BSC link is invalid, expired or already used."},{status:400});
  const member=await first("SELECT 1 AS found FROM brand_members WHERE brand_id=? AND user_id=?",row.brand_id,user.id);
  if(!member)return NextResponse.json({error:"This account is not an authorized member of the brand linked to this BSC invitation."},{status:403});
  if(row.status==="suspended")return NextResponse.json({error:"This brand is suspended and cannot claim a BSC code."},{status:400});
  // Claim the one-time token first. Only the request that changes exactly one row may continue.
  const claimed=await run("UPDATE bsc_issuances SET claimed_at=CURRENT_TIMESTAMP WHERE id=? AND claimed_at IS NULL AND expires_at>?",row.id,new Date().toISOString());
  if((claimed.meta.changes??0)!==1)return NextResponse.json({error:"This BSC link has already been used or expired."},{status:409});
  await batch([
   {sql:"UPDATE brands SET status='verified',bsc_code=? WHERE id=?",values:[row.bsc_code,row.brand_id]},
   {sql:"UPDATE bsc_code_requests SET status='approved',admin_note='BSC code claimed using the one-time email invitation.' WHERE brand_id=? AND status='pending'",values:[row.brand_id]},
   {sql:"INSERT INTO admin_audit_logs(admin_id,action,target_type,target_id,details) VALUES(NULL,'bsc_code_claimed','brand',?,?)",values:[row.brand_id,JSON.stringify({userId:user.id,issuanceId:row.id,code:row.bsc_code})]}
  ]);
  return NextResponse.json({ok:true,bscCode:row.bsc_code,message:"BSC code activated. Your brand is now verified."});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to claim this BSC code."},{status:400});}
}
