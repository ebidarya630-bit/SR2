import {NextResponse} from "next/server";
import {getSession} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";
const MAX_FILE=50*1024*1024;
const MAX_TOTAL=100*1024*1024;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VIDEO_TYPES=["video/mp4","video/quicktime","video/webm"];
const EVIDENCE_TYPES=["image/jpeg","image/png","image/webp","application/pdf"];

type SubmittedAsset={
 application_id:string;asset_type:"test_video"|"supporting_file";storage_path:string;
 original_filename:string;mime_type:string;file_size_bytes:number;uploaded_by:string;sort_order:number;
};

export async function POST(request:Request){
 const user=await getSession();if(!user)return NextResponse.json({error:"Please sign in first."},{status:401});
 const supabase=await createClient();
 let uploadedPaths:string[]=[];
 try{
  const body=await request.json();
  const applicationId=String(body.applicationId??"");
  const brandId=String(body.brandId??"");
  const manufacturer=String(body.manufacturer??"").trim().slice(0,120);
  const model=String(body.modelName??"").trim().slice(0,160);
  const modelNumber=String(body.modelNumber??"").trim().slice(0,100);
  const releaseDate=String(body.releaseDate??"").trim();
  const nits=Number(body.nits);const lux=Number(body.lux);
  const notes=String(body.testNotes??"").trim().slice(0,5000);
  const testVideoPath=String(body.testVideoPath??"");
  const assets=body.assets as SubmittedAsset[];
  if(!UUID.test(applicationId)||!UUID.test(brandId))return NextResponse.json({error:"Invalid application or brand identifier."},{status:400});
  if(!manufacturer||!model)return NextResponse.json({error:"Manufacturer and full model name are required."},{status:400});
  if(!Number.isFinite(nits)||nits<=0||nits>100000||!Number.isFinite(lux)||lux<=0||lux>1000000)return NextResponse.json({error:"Enter valid measured nits and lux values."},{status:400});
  if(!notes)return NextResponse.json({error:"Describe the test setup and measurement conditions."},{status:400});
  if(body.archiveConsent!==true)return NextResponse.json({error:"Please confirm the device-return and archive terms before submitting."},{status:400});
  if(releaseDate&&!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate))return NextResponse.json({error:"Enter a valid release date."},{status:400});
  if(!Array.isArray(assets)||assets.length<2||assets.length>13)return NextResponse.json({error:"Upload one test video and between 1 and 12 evidence files."},{status:400});

  const prefix=user.id+"/"+applicationId+"/";
  const totalBytes=assets.reduce((sum,item)=>sum+Number(item.file_size_bytes||0),0);
  if(totalBytes>MAX_TOTAL)return NextResponse.json({error:"The combined upload size must be 100 MB or smaller."},{status:400});
  let hasVideo=false;let hasEvidence=false;
  for(const item of assets){
   const mime=String(item.mime_type??"").toLowerCase();
   if(item.application_id!==applicationId||item.uploaded_by!==user.id||!item.storage_path.startsWith(prefix))return NextResponse.json({error:"Invalid evidence ownership or storage path."},{status:400});
   if(!Number.isInteger(item.file_size_bytes)||item.file_size_bytes<1||item.file_size_bytes>MAX_FILE)return NextResponse.json({error:"Each uploaded file must be 50 MB or smaller."},{status:400});
   if(item.asset_type==="test_video"&&VIDEO_TYPES.includes(mime))hasVideo=true;
   else if(item.asset_type==="supporting_file"&&EVIDENCE_TYPES.includes(mime))hasEvidence=true;
   else return NextResponse.json({error:"Unsupported evidence type."},{status:400});
   uploadedPaths.push(item.storage_path);
  }
  if(!hasVideo||!hasEvidence||!uploadedPaths.includes(testVideoPath))return NextResponse.json({error:"The test video and supporting evidence are required."},{status:400});

  const {data:objects,error:storageError}=await supabase.storage.from("sr-private").list(user.id+"/"+applicationId,{limit:20});
  if(storageError)throw new Error("Unable to verify uploaded evidence. Please try again.");
  const stored=new Set((objects??[]).map(object=>prefix+object.name));
  if(uploadedPaths.some(storagePath=>!stored.has(storagePath)))throw new Error("One or more evidence files are missing. Please upload them again.");

  const {data:createdId,error:submitError}=await supabase.rpc("submit_certification_application",{
   p_application_id:applicationId,p_brand_id:brandId,p_manufacturer:manufacturer,p_full_model_name:model,
   p_model_number:modelNumber||null,p_release_date:releaseDate||null,p_nit_value:nits,p_lux_value:lux,
   p_test_video_path:testVideoPath,p_test_method_notes:notes,p_assets:assets,
  });
  if(submitError||!createdId)throw new Error("Unable to save the certification application and evidence records. Please try again.");
  uploadedPaths=[];
  return NextResponse.json({ok:true,applicationId,message:"Certification application submitted for review."});
 }catch(e){
  if(uploadedPaths.length)await supabase.storage.from("sr-private").remove(uploadedPaths);
  return NextResponse.json({error:e instanceof Error?e.message:"Unable to submit application."},{status:400});
 }
}
