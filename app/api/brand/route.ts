import {NextResponse} from "next/server";
import {getSession} from "@/lib/auth";
import {db} from "@/lib/db";
export const runtime="nodejs";
export async function GET(){
 const user=await getSession();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const brands=db.prepare("SELECT b.id,b.legal_name legalName,b.display_name displayName,b.official_email officialEmail,b.website_url websiteUrl,b.bsc_code bscCode,b.status,b.created_at createdAt FROM brands b JOIN brand_members m ON m.brand_id=b.id WHERE m.user_id=? ORDER BY b.created_at DESC").all(user.id);
 const apps=db.prepare("SELECT a.id,a.brand_id brandId,a.full_model_name modelName,a.manufacturer,a.model_number modelNumber,a.status,a.created_at createdAt FROM certification_applications a JOIN brand_members m ON m.brand_id=a.brand_id WHERE m.user_id=? ORDER BY a.created_at DESC").all(user.id);
 return NextResponse.json({brands,applications:apps});
}
