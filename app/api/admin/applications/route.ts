import {NextResponse} from "next/server";
import {getSession} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";

export async function GET(){
 const user=await getSession();if(!user||user.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 const supabase=await createClient();
 const {data,error}=await supabase.from("certification_applications")
  .select("id,manufacturer,full_model_name,model_number,status,created_at,nit_value,lux_value,test_method_notes,brands!certification_applications_brand_id_fkey(display_name,bsc_code),profiles!certification_applications_submitted_by_fkey(email),application_assets(id)")
  .order("created_at",{ascending:false}).limit(100);
 if(error)return NextResponse.json({error:"Unable to load applications."},{status:500});
 const applications=(data??[]).map((row:any)=>({id:row.id,manufacturer:row.manufacturer,modelName:row.full_model_name,modelNumber:row.model_number,status:row.status,createdAt:row.created_at,nits:row.nit_value,lux:row.lux_value,testNotes:row.test_method_notes,brandName:row.brands?.display_name??"Unknown brand",bscCode:row.brands?.bsc_code??"",submitterEmail:row.profiles?.email??"",assetCount:row.application_assets?.length??0}));
 return NextResponse.json({applications});
}

export async function PATCH(request:Request){
 const user=await getSession();if(!user||user.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 try{
  const body=await request.json();const id=String(body.id??"");const status=String(body.status??"");const note=String(body.note??"").trim().slice(0,3000);
  if(!id||!["under_review","needs_information","rejected"].includes(status))return NextResponse.json({error:"Invalid review action."},{status:400});
  const supabase=await createClient();
  const {data,error}=await supabase.from("certification_applications").update({status,decision_note:note||null,reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq("id",id).in("status",["submitted","under_review","needs_information"]).select("id").maybeSingle();
  if(error)return NextResponse.json({error:"Unable to update application."},{status:400});
  if(!data)return NextResponse.json({error:"Application not found or no longer reviewable."},{status:404});
  await supabase.from("admin_audit_logs").insert({admin_id:user.id,action:"application_status_changed",target_type:"certification_application",target_id:id,details:{status,note}});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to update application."},{status:400});}
}
