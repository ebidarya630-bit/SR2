import {NextResponse} from "next/server";
import {getSession} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";

export async function GET(){
 const user=await getSession();if(!user||user.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 const supabase=await createClient();
 const {data,error}=await supabase.from("brands").select("id,legal_name,display_name,official_email,website_url,founded_on,bsc_code,status,created_at,bsc_code_requests(status,created_at)").order("created_at",{ascending:false}).limit(100);
 if(error)return NextResponse.json({error:"Unable to load brands."},{status:500});
 const brands=(data??[]).map((b:any)=>({id:b.id,legalName:b.legal_name,displayName:b.display_name,officialEmail:b.official_email,websiteUrl:b.website_url,foundedOn:b.founded_on,bscCode:b.bsc_code,status:b.status,createdAt:b.created_at,bscRequestStatus:(b.bsc_code_requests??[]).sort((a:any,c:any)=>c.created_at.localeCompare(a.created_at))[0]?.status??null}));
 return NextResponse.json({brands});
}

export async function PATCH(request:Request){
 const user=await getSession();if(!user||user.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 try{
  const body=await request.json();const id=String(body.id??"");const status=String(body.status??"");const code=String(body.bscCode??"").trim().toUpperCase();
  if(!id||!["verified","rejected","suspended"].includes(status))return NextResponse.json({error:"Invalid brand action."},{status:400});
  if(status==="verified"&&!/^BSC-[A-Z0-9]{4,16}$/.test(code))return NextResponse.json({error:"Assign a unique BSC code such as BSC-A7K29 before verifying."},{status:400});
  const supabase=await createClient();
  const update=status==="verified"?{status,bsc_code:code,verified_by:user.id,verified_at:new Date().toISOString(),rejection_reason:null}:{status,bsc_code:null,verified_by:null,verified_at:null,rejection_reason:status==="rejected"?"Rejected by SR administrator":null};
  const {data,error}=await supabase.from("brands").update(update).eq("id",id).select("id").maybeSingle();
  if(error)return NextResponse.json({error:"Unable to update brand. The BSC code may already be assigned."},{status:400});
  if(!data)return NextResponse.json({error:"Brand not found."},{status:404});
  await supabase.from("bsc_code_requests").update({status:status==="verified"?"approved":"rejected",admin_note:status==="verified"?"Brand verified and BSC code assigned.":"Brand "+status,reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq("brand_id",id).eq("status","pending");
  await supabase.from("admin_audit_logs").insert({admin_id:user.id,action:"brand_status_changed",target_type:"brand",target_id:id,details:{status,bscCode:status==="verified"?code:null}});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to update brand. The BSC code may already be assigned."},{status:400});}
}
