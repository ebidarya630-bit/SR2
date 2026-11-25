import {NextResponse} from "next/server";
import {getSession} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";

export async function POST(request:Request){
 const user=await getSession();if(!user)return NextResponse.json({error:"Sign in with the brand account before claiming this code."},{status:401});
 try{
  const body=await request.json();const token=String(body.token??"");
  if(token.length<30||token.length>256)return NextResponse.json({error:"Invalid claim link."},{status:400});
  const supabase=await createClient();
  const {data:code,error}=await supabase.rpc("claim_bsc_code",{raw_token:token});
  if(error)return NextResponse.json({error:"This BSC link is invalid, expired, already used, or not assigned to your brand."},{status:400});
  return NextResponse.json({ok:true,bscCode:code,message:"BSC code activated. Your brand is now verified."});
 }catch{return NextResponse.json({error:"Unable to claim this BSC code."},{status:400});}
}
