import {NextResponse} from "next/server";
import {createHash,randomBytes,randomUUID} from "node:crypto";
import {getSession} from "@/lib/auth";
import {db} from "@/lib/db";
export const runtime="nodejs";
export async function POST(request:Request){
 const admin=await getSession();if(!admin||admin.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 try{
  const body=await request.json();const brandId=String(body.brandId??"");const suffix=String(body.suffix??"").trim().toUpperCase();
  if(!/^[A-Z0-9]{3,16}$/.test(suffix))return NextResponse.json({error:"Choose 3–16 letters or numbers for the BSC suffix."},{status:400});
  const brand=db.prepare("SELECT id,display_name,official_email,status FROM brands WHERE id=?").get(brandId) as {id:string;display_name:string;official_email:string;status:string}|undefined;
  if(!brand)return NextResponse.json({error:"Brand not found."},{status:404});
  if(brand.status==="suspended")return NextResponse.json({error:"A suspended brand cannot receive a BSC code."},{status:400});
  const pending=db.prepare("SELECT id FROM bsc_issuances WHERE brand_id=? AND claimed_at IS NULL AND expires_at>? LIMIT 1").get(brandId,new Date().toISOString());
  if(pending)return NextResponse.json({error:"This brand already has an unused BSC invitation. Use the existing link or wait for it to expire."},{status:409});
  const code="BSC-"+suffix;const token=randomBytes(32).toString("base64url");const tokenHash=createHash("sha256").update(token).digest("hex");
  const expires=new Date(Date.now()+7*24*60*60*1000).toISOString();const id=randomUUID();
  try{db.prepare("INSERT INTO bsc_issuances(id,brand_id,bsc_code,token_hash,expires_at,created_by) VALUES(?,?,?,?,?,?)").run(id,brandId,code,tokenHash,expires,admin.id);}
  catch{return NextResponse.json({error:"That BSC code has already been issued. Choose another suffix."},{status:409});}
  db.prepare("INSERT INTO admin_audit_logs(admin_id,action,target_type,target_id,details) VALUES(?,?,?,?,?)").run(admin.id,"bsc_claim_link_created","brand",brandId,JSON.stringify({issuanceId:id,code,expires}));
  const base=(process.env.APP_URL||new URL(request.url).origin).replace(/\/$/,"");
  return NextResponse.json({ok:true,brandName:brand.display_name,officialEmail:brand.official_email,bscCode:code,claimUrl:base+"/bsc/claim?token="+encodeURIComponent(token),expiresAt:expires});
 }catch{return NextResponse.json({error:"Unable to create BSC claim link."},{status:500});}
}
