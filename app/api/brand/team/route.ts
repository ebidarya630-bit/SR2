import {NextResponse} from "next/server";
import {createHash,randomBytes,randomUUID} from "node:crypto";
import {getSession} from "@/lib/auth";
import {all,first,run} from "@/lib/db";
export const runtime="nodejs";

export async function GET(){
 const user=await getSession();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const memberships=await all<{brandId:string;brandName:string;role:string}>("SELECT b.id brandId,b.display_name brandName,m.member_role role FROM brand_members m JOIN brands b ON b.id=m.brand_id WHERE m.user_id=? ORDER BY b.display_name",user.id);
 const brandIds=memberships.map(x=>x.brandId);
 if(!brandIds.length)return NextResponse.json({memberships:[],members:[],invitations:[]});
 const placeholders=brandIds.map(()=>"?").join(",");
 const members=await all("SELECT m.brand_id brandId,m.member_role role,u.id userId,u.email,u.username FROM brand_members m JOIN users u ON u.id=m.user_id WHERE m.brand_id IN ("+placeholders+") ORDER BY u.email",...brandIds);
 const invitations=await all("SELECT i.id,i.brand_id brandId,i.email,i.member_role role,i.expires_at expiresAt,i.created_at createdAt FROM brand_invitations i WHERE i.brand_id IN ("+placeholders+") AND i.accepted_at IS NULL AND i.expires_at>CURRENT_TIMESTAMP ORDER BY i.created_at DESC",...brandIds);
 return NextResponse.json({memberships,members,invitations});
}

export async function POST(request:Request){
 const user=await getSession();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const body=await request.json();const brandId=String(body.brandId??"");const email=String(body.email??"").trim().toLowerCase();const role=String(body.role??"viewer");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:"Enter a valid team member email."},{status:400});
  if(!["manager","reviewer","viewer"].includes(role))return NextResponse.json({error:"Invalid team role."},{status:400});
  const member=await first<{member_role:string}>("SELECT member_role FROM brand_members WHERE brand_id=? AND user_id=?",brandId,user.id);
  if(!member||member.member_role!=="owner")return NextResponse.json({error:"Only the brand owner can invite team members."},{status:403});
  const account=await first<{id:string}>("SELECT id FROM users WHERE email=?",email);
  if(account){
   const existing=await first("SELECT 1 AS found FROM brand_members WHERE brand_id=? AND user_id=?",brandId,account.id);
   if(existing)return NextResponse.json({error:"This account is already a member of the brand."},{status:409});
  }
  const pending=await first("SELECT id FROM brand_invitations WHERE brand_id=? AND email=? AND accepted_at IS NULL AND datetime(expires_at)>CURRENT_TIMESTAMP",brandId,email);
  if(pending)return NextResponse.json({error:"An active invitation already exists for this email."},{status:409});
  const token=randomBytes(32).toString("base64url");const hash=createHash("sha256").update(token).digest("hex");const id=randomUUID();
  await run("INSERT INTO brand_invitations(id,brand_id,email,member_role,token_hash,expires_at,created_by) VALUES(?,?,?,?,?,?,?)",id,brandId,email,role,hash,new Date(Date.now()+7*86400000).toISOString(),user.id);
  await run("INSERT INTO brand_activity_logs(id,brand_id,actor_user_id,action,details) VALUES(?,?,?,'team_invitation_created',?)",randomUUID(),brandId,user.id,JSON.stringify({email,role}));
  const base=(process.env.APP_URL||new URL(request.url).origin).replace(/\/$/,"");
  return NextResponse.json({ok:true,invitationUrl:base+"/brand/invite?token="+encodeURIComponent(token),email,role,expiresAt:new Date(Date.now()+7*86400000).toISOString(),delivery:"manual"});
 }catch{return NextResponse.json({error:"Unable to create team invitation."},{status:400});}
}

export async function DELETE(request:Request){
 const user=await getSession();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const body=await request.json();const brandId=String(body.brandId??"");const memberUserId=String(body.userId??"");
  const owner=await first("SELECT 1 AS found FROM brand_members WHERE brand_id=? AND user_id=? AND member_role='owner'",brandId,user.id);
  if(!owner)return NextResponse.json({error:"Only the brand owner can remove team members."},{status:403});
  if(memberUserId===user.id)return NextResponse.json({error:"The owner cannot remove their own account."},{status:400});
  const result=await run("DELETE FROM brand_members WHERE brand_id=? AND user_id=? AND member_role<>'owner'",brandId,memberUserId);
  if(!(result.meta.changes??0))return NextResponse.json({error:"Member not found or cannot be removed."},{status:404});
  await run("INSERT INTO brand_activity_logs(id,brand_id,actor_user_id,action,details) VALUES(?,?,?,'team_member_removed',?)",randomUUID(),brandId,user.id,JSON.stringify({userId:memberUserId}));
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to remove team member."},{status:400});}
}
