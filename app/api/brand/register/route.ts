import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {getSession} from "@/lib/auth";
import {db} from "@/lib/db";
export const runtime="nodejs";
export async function POST(request:Request){
 const user=await getSession();if(!user)return NextResponse.json({error:"Please sign in first."},{status:401});
 try{
  const body=await request.json();
  const legal=String(body.legalName??"").trim().slice(0,160);
  const display=String(body.displayName??"").trim().slice(0,120);
  const email=String(body.officialEmail??"").trim().toLowerCase().slice(0,254);
  const website=String(body.websiteUrl??"").trim().slice(0,300);
  const founded=String(body.foundedOn??"").trim();
  if(!legal||!display||!/^\S+@\S+\.\S+$/.test(email))return NextResponse.json({error:"Legal name, display name and a valid official email are required."},{status:400});
  if(website){try{const u=new URL(website);if(!["http:","https:"].includes(u.protocol))throw new Error();}catch{return NextResponse.json({error:"Website must be a valid http or https URL."},{status:400});}}
  const id=randomUUID();
  const create=db.transaction(()=>{
   db.prepare("INSERT INTO brands(id,owner_user_id,legal_name,display_name,official_email,website_url,founded_on,status) VALUES(?,?,?,?,?,?,?,'pending')").run(id,user.id,legal,display,email,website||null,founded||null);
   db.prepare("INSERT INTO brand_members(brand_id,user_id,member_role) VALUES(?,?,'owner')").run(id,user.id);
   db.prepare("INSERT INTO bsc_code_requests(id,brand_id,requested_by,contact_email,status) VALUES(?,?,?,?,'pending')").run(randomUUID(),id,user.id,email);
   db.prepare("INSERT INTO admin_audit_logs(admin_id,action,target_type,target_id,details) VALUES(NULL,'brand_registered','brand',?,?)").run(id,JSON.stringify({owner:user.id}));
  });
  create();
  return NextResponse.json({ok:true,brandId:id,message:"Brand submitted for manual review. A BSC request has also been created."});
 }catch(e){return NextResponse.json({error:"Could not submit the brand. Check whether you already registered it."},{status:400});}
}
