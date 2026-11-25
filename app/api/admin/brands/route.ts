import {NextResponse} from "next/server";
import {getSession} from "@/lib/auth";
import {first,all,run,batch} from "@/lib/db";
export const runtime="nodejs";
export async function GET(){
 const user=await getSession();if(!user||user.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 const brands=await all("SELECT b.id,b.legal_name legalName,b.display_name displayName,b.official_email officialEmail,b.website_url websiteUrl,b.founded_on foundedOn,b.bsc_code bscCode,b.status,b.created_at createdAt,(SELECT status FROM bsc_code_requests r WHERE r.brand_id=b.id ORDER BY r.created_at DESC LIMIT 1) bscRequestStatus FROM brands b ORDER BY b.created_at DESC LIMIT 100");
 return NextResponse.json({brands});
}
export async function PATCH(request:Request){
 const user=await getSession();if(!user||user.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 try{
  const body=await request.json();const id=String(body.id??"");const status=String(body.status??"");const code=String(body.bscCode??"").trim().toUpperCase();
  if(!id||!["verified","rejected","suspended"].includes(status))return NextResponse.json({error:"Invalid brand action."},{status:400});
  if(status==="verified"&&!/^BSC-[A-Z0-9]{4,16}$/.test(code))return NextResponse.json({error:"Assign a unique BSC code such as BSC-A7K29 before verifying."},{status:400});
  const brand=await first("SELECT id FROM brands WHERE id=?",id);if(!brand)return NextResponse.json({error:"Brand not found."},{status:404});
  const statements=status==="verified"?[
   {sql:"UPDATE brands SET status='verified',bsc_code=? WHERE id=?",values:[code,id]},
   {sql:"UPDATE bsc_code_requests SET status='approved',admin_note='Brand verified and BSC code assigned.' WHERE brand_id=? AND status='pending'",values:[id]}
  ]:[
   {sql:"UPDATE brands SET status=?,bsc_code=NULL WHERE id=?",values:[status,id]},
   {sql:"UPDATE bsc_code_requests SET status=?,admin_note=? WHERE brand_id=? AND status='pending'",values:[status,"Brand "+status,id]}
  ];
  await batch([...statements,{sql:"INSERT INTO admin_audit_logs(admin_id,action,target_type,target_id,details) VALUES(?,?,?,?,?)",values:[user.id,"brand_status_changed","brand",id,JSON.stringify({status,bscCode:status==="verified"?code:null})]}]);
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to update brand. The BSC code may already be assigned."},{status:400});}
}
