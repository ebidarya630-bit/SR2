import {NextResponse} from "next/server";
import {getSession} from "@/lib/auth";
import {all} from "@/lib/db";
export const runtime="nodejs";
export async function GET(){
 const user=await getSession();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const brands=await all("SELECT b.id,b.legal_name legalName,b.display_name displayName,b.official_email officialEmail,b.website_url websiteUrl,b.founded_on foundedOn,b.country_code countryCode,b.registration_number registrationNumber,b.contact_name contactName,b.contact_phone contactPhone,b.logo_path logoPath,b.bsc_code bscCode,b.status,b.created_at createdAt,m.member_role memberRole FROM brands b JOIN brand_members m ON m.brand_id=b.id WHERE m.user_id=? ORDER BY b.created_at DESC",user.id);
 const apps=await all("SELECT a.id,a.brand_id brandId,a.full_model_name modelName,a.manufacturer,a.model_number modelNumber,a.status,a.decision_note decisionNote,a.created_at createdAt,(SELECT sr_code FROM certificates c WHERE c.application_id=a.id AND c.status='active' LIMIT 1) srCode FROM certification_applications a JOIN brand_members m ON m.brand_id=a.brand_id WHERE m.user_id=? ORDER BY a.created_at DESC",user.id);
 return NextResponse.json({brands,applications:apps});
}
