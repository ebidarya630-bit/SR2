import {NextResponse} from "next/server";
import {createHash,randomBytes} from "node:crypto";
import {getSession} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";

export async function POST(request:Request){
 const admin=await getSession();if(!admin||admin.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 try{
  const body=await request.json();const brandId=String(body.brandId??"");const suffix=String(body.suffix??"").trim().toUpperCase();
  if(!/^[A-Z0-9]{3,16}$/.test(suffix))return NextResponse.json({error:"Choose 3–16 letters or numbers for the BSC suffix."},{status:400});
  const supabase=await createClient();
  const {data:brand,error:brandError}=await supabase.from("brands").select("id,display_name,official_email,status").eq("id",brandId).maybeSingle();
  if(brandError||!brand)return NextResponse.json({error:"Brand not found."},{status:404});
  if(brand.status==="suspended")return NextResponse.json({error:"A suspended brand cannot receive a BSC code."},{status:400});
  const {data:pending}=await supabase.from("bsc_issuances").select("id").eq("brand_id",brandId).is("claimed_at",null).gt("expires_at",new Date().toISOString()).limit(1).maybeSingle();
  if(pending)return NextResponse.json({error:"This brand already has an unused BSC invitation. Use the existing link or wait for it to expire."},{status:409});
  const code="BSC-"+suffix;const token=randomBytes(32).toString("base64url");const tokenHash=createHash("sha256").update(token).digest("hex");
  const expires=new Date(Date.now()+7*24*60*60*1000).toISOString();
  const {data:requestRow}=await supabase.from("bsc_code_requests").select("id").eq("brand_id",brandId).eq("status","pending").order("created_at",{ascending:false}).limit(1).maybeSingle();
  const {data:issuance,error}=await supabase.from("bsc_issuances").insert({brand_id:brandId,request_id:requestRow?.id??null,bsc_code:code,claim_token_hash:tokenHash,expires_at:expires,created_by:admin.id}).select("id").single();
  if(error)return NextResponse.json({error:"That BSC code may already be issued. Choose another suffix."},{status:409});
  await supabase.from("admin_audit_logs").insert({admin_id:admin.id,action:"bsc_claim_link_created",target_type:"brand",target_id:brandId,details:{issuanceId:issuance.id,code,expires}});
  const base=(process.env.APP_URL||new URL(request.url).origin).replace(/\\/$/,"");
  return NextResponse.json({ok:true,brandName:brand.display_name,officialEmail:brand.official_email,bscCode:code,claimUrl:base+"/bsc/claim?token="+encodeURIComponent(token),expiresAt:expires});
 }catch{return NextResponse.json({error:"Unable to create BSC claim link."},{status:500});}
}
