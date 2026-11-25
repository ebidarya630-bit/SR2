import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {getSession} from "@/lib/auth";
import {db} from "@/lib/db";
export const runtime="nodejs";
export async function GET(){
 const user=await getSession();if(!user||user.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 const rows=db.prepare("SELECT a.id,a.manufacturer,a.full_model_name modelName,a.model_number modelNumber,a.status,a.created_at createdAt,a.nit_value nits,a.lux_value lux,a.test_method_notes testNotes,b.display_name brandName,b.bsc_code bscCode,u.email submitterEmail,(SELECT count(*) FROM application_assets x WHERE x.application_id=a.id) assetCount FROM certification_applications a JOIN brands b ON b.id=a.brand_id JOIN users u ON u.id=a.submitted_by ORDER BY a.created_at DESC LIMIT 100").all();
 return NextResponse.json({applications:rows});
}
export async function PATCH(request:Request){
 const user=await getSession();if(!user||user.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 try{
  const body=await request.json();const id=String(body.id??"");const status=String(body.status??"");const note=String(body.note??"").trim().slice(0,3000);
  if(!id||!["under_review","needs_information","rejected"].includes(status))return NextResponse.json({error:"Invalid review action."},{status:400});
  const result=db.prepare("UPDATE certification_applications SET status=?,decision_note=? WHERE id=? AND status IN ('submitted','under_review','needs_information')").run(status,note||null,id);
  if(!result.changes)return NextResponse.json({error:"Application not found or no longer reviewable."},{status:404});
  db.prepare("INSERT INTO admin_audit_logs(admin_id,action,target_type,target_id,details) VALUES(?,?,?,?,?)").run(user.id,"application_status_changed","certification_application",id,JSON.stringify({status,note}));
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to update application."},{status:400});}
}
