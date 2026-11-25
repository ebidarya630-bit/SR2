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
  if(!legal||!display||!/^\S+@\S+\.\S+$/.test(email))return NextResponse.json({error:"Legal name, display name and a valid official email are required."},{status:400});
  if(website){try{const u=new URL(website);if(!["http:","https:"].includes(u.protocol))throw new Error();}catch{return NextResponse.json({error:"Website must be a valid http or https URL."},{status:400});}}
  if(founded&&!/^\d{4}-\d{2}-\d{2}$/.test(founded))return NextResponse.json({error:"Enter a valid founding date."},{status:400});
  const supabase=await createClient();
  const {data:brandId,error}=await supabase.rpc("register_brand",{p_legal_name:legal,p_display_name:display,p_official_email:email,p_website_url:website||null,p_founded_on:founded||null});
  if(error||!brandId)return NextResponse.json({error:"Could not submit the brand. Check the details and try again."},{status:400});
  return NextResponse.json({ok:true,brandId,message:"Brand submitted for manual review. A BSC request has also been created."});
 }catch{return NextResponse.json({error:"Could not submit the brand. Please try again."},{status:400});}
}
