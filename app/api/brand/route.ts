import {NextResponse} from "next/server";
import {getSession} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";

export async function GET(){
 const user=await getSession();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const supabase=await createClient();
 const {data:members,error:memberError}=await supabase.from("brand_members").select("brand_id").eq("user_id",user.id);
 if(memberError)return NextResponse.json({error:"Unable to load brand membership."},{status:500});
 const ids=(members??[]).map(item=>item.brand_id);
 if(!ids.length)return NextResponse.json({brands:[],applications:[]});
 const [{data:brandRows,error:brandError},{data:appRows,error:appError}]=await Promise.all([
  supabase.from("brands").select("id,legal_name,display_name,official_email,website_url,bsc_code,status,created_at").in("id",ids).order("created_at",{ascending:false}),
  supabase.from("certification_applications").select("id,brand_id,full_model_name,manufacturer,model_number,status,created_at").in("brand_id",ids).order("created_at",{ascending:false}),
 ]);
 if(brandError||appError)return NextResponse.json({error:"Unable to load brand workspace."},{status:500});
 const brands=(brandRows??[]).map(b=>({id:b.id,legalName:b.legal_name,displayName:b.display_name,officialEmail:b.official_email,websiteUrl:b.website_url,bscCode:b.bsc_code,status:b.status,createdAt:b.created_at}));
 const applications=(appRows??[]).map(a=>({id:a.id,brandId:a.brand_id,modelName:a.full_model_name,manufacturer:a.manufacturer,modelNumber:a.model_number,status:a.status,createdAt:a.created_at}));
 return NextResponse.json({brands,applications});
}
