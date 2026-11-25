import {NextResponse} from "next/server";
import {getSession} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
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
  if(!legal||!display||!/^\\S+@\\S+\\.\\S+$/.test(email))return NextResponse.json({error:"Legal name, display name and a valid official email are required."},{status:400});
  if(website){try{const u=new URL(website);if(!["http:","https:"].includes(u.protocol))throw new Error();}catch{return NextResponse.json({error:"Website must be a valid http or https URL."},{status:400});}}
  const supabase=await createClient();
  const {data:brand,error:brandError}=await supabase.from("brands").insert({owner_user_id:user.id,legal_name:legal,display_name:display,official_email:email,website_url:website||null,founded_on:founded||null,status:"pending"}).select("id").single();
  if(brandError||!brand)return NextResponse.json({error:"Could not create the brand. Check whether you already registered it."},{status:400});
  const {error:memberError}=await supabase.from("brand_members").insert({brand_id:brand.id,user_id:user.id,member_role:"owner"});
  if(memberError){await supabase.from("brands").delete().eq("id",brand.id);return NextResponse.json({error:"Could not finish setting up brand access."},{status:400});}
  const {error:requestError}=await supabase.from("bsc_code_requests").insert({brand_id:brand.id,requested_by:user.id,contact_email:email,status:"pending"});
  if(requestError){await supabase.from("brands").delete().eq("id",brand.id);return NextResponse.json({error:"Could not create the BSC verification request."},{status:400});}
  return NextResponse.json({ok:true,brandId:brand.id,message:"Brand submitted for manual review. A BSC request has also been created."});
 }catch{return NextResponse.json({error:"Could not submit the brand. Please try again."},{status:400});}
}
