import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {getSession} from "@/lib/auth";
import {first,run} from "@/lib/db";
export const runtime="nodejs";

export async function PATCH(request:Request){
 const user=await getSession();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const body=await request.json();
  const brandId=String(body.brandId??"");
  const legalName=String(body.legalName??"").trim().slice(0,160);
  const displayName=String(body.displayName??"").trim().slice(0,120);
  const website=String(body.websiteUrl??"").trim().slice(0,300);
  const founded=String(body.foundedOn??"").trim();
  const country=String(body.countryCode??"").trim().toUpperCase().slice(0,2);
  const registration=String(body.registrationNumber??"").trim().slice(0,100);
  const contact=String(body.contactName??"").trim().slice(0,120);
  const phone=String(body.contactPhone??"").trim().slice(0,40);
  if(!brandId||!legalName||!displayName)return NextResponse.json({error:"Brand, legal name and public name are required."},{status:400});
  if(website){try{const url=new URL(website);if(!["http:","https:"].includes(url.protocol))throw new Error();}catch{return NextResponse.json({error:"Enter a valid HTTPS or HTTP website URL."},{status:400});}}
  const member=await first<{member_role:string}>("SELECT member_role FROM brand_members WHERE brand_id=? AND user_id=?",brandId,user.id);
  if(!member||!["owner","manager"].includes(member.member_role))return NextResponse.json({error:"Only brand owners and managers can edit company details."},{status:403});
  const result=await run("UPDATE brands SET legal_name=?,display_name=?,website_url=?,founded_on=?,country_code=?,registration_number=?,contact_name=?,contact_phone=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",legalName,displayName,website||null,founded||null,country||null,registration||null,contact||null,phone||null,brandId);
  if(!(result.meta.changes??0))return NextResponse.json({error:"Brand not found."},{status:404});
  await run("INSERT INTO brand_activity_logs(id,brand_id,actor_user_id,action,details) VALUES(?,?,?,'profile_updated',?)",randomUUID(),brandId,user.id,JSON.stringify({fields:["legalName","displayName","websiteUrl","foundedOn","countryCode","registrationNumber","contactName","contactPhone"]}));
  return NextResponse.json({ok:true,message:"Company profile updated."});
 }catch{return NextResponse.json({error:"Unable to update company profile."},{status:400});}
}
