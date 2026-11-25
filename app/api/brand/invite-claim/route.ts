import {NextResponse} from "next/server";
import {createHash,randomUUID} from "node:crypto";
import {getSession} from "@/lib/auth";
import {first,run,batch} from "@/lib/db";
export const runtime="nodejs";
export async function POST(request:Request){
 const user=await getSession();if(!user)return NextResponse.json({error:"Sign in to the invited account first."},{status:401});
 try{
  const body=await request.json();const token=String(body.token??"");
  if(token.length<30||token.length>200)return NextResponse.json({error:"Invalid invitation link."},{status:400});
  const hash=createHash("sha256").update(token).digest("hex");
  const invite=await first<{id:string;brand_id:string;email:string;member_role:string;expires_at:string;accepted_at:string|null}>("SELECT id,brand_id,email,member_role,expires_at,accepted_at FROM brand_invitations WHERE token_hash=?",hash);
  if(!invite||invite.accepted_at||new Date(invite.expires_at).getTime()<Date.now())return NextResponse.json({error:"This invitation is invalid, expired or already used."},{status:400});
  if(invite.email.toLowerCase()!==user.email.toLowerCase())return NextResponse.json({error:"Sign in with the exact email address that received this invitation."},{status:403});
  const claimed=await run("UPDATE brand_invitations SET accepted_at=CURRENT_TIMESTAMP WHERE id=? AND accepted_at IS NULL AND expires_at>CURRENT_TIMESTAMP",invite.id);
  if((claimed.meta.changes??0)!==1)return NextResponse.json({error:"This invitation has already been used or expired."},{status:409});
  await batch([
   {sql:"INSERT INTO brand_members(brand_id,user_id,member_role) VALUES(?,?,?)",values:[invite.brand_id,user.id,invite.member_role]},
   {sql:"INSERT INTO brand_activity_logs(id,brand_id,actor_user_id,action,details) VALUES(?,?,?,'team_invitation_accepted',?)",values:[randomUUID(),invite.brand_id,user.id,JSON.stringify({email:user.email,role:invite.member_role})]}
  ]);
  return NextResponse.json({ok:true,message:"You have joined the brand team."});
 }catch{return NextResponse.json({error:"Unable to accept this invitation."},{status:400});}
}
