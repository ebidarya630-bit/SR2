import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import path from "node:path";
import {getSession} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";
const MAX_FILE=50*1024*1024;

function validateFile(file:File,kind:"video"|"evidence"){
 if(file.size>MAX_FILE)throw new Error("Each uploaded file must be 50 MB or smaller.");
 const ext=path.extname(file.name).toLowerCase();
 const allowed=kind==="video"?[".mp4",".mov",".webm"]:[".jpg",".jpeg",".png",".webp",".pdf"];
 if(!allowed.includes(ext))throw new Error("Unsupported file type: "+file.name);
 return {ext,assetType:kind==="video"?"test_video":"supporting_file"};
}

export async function POST(request:Request){
 const user=await getSession();if(!user)return NextResponse.json({error:"Please sign in first."},{status:401});
 const supabase=await createClient();
 const uploaded:string[]=[];
 try{
  const form=await request.formData();
  const brandId=String(form.get("brandId")??"");
  const manufacturer=String(form.get("manufacturer")??"").trim().slice(0,120);
  const model=String(form.get("modelName")??"").trim().slice(0,160);
  const modelNumber=String(form.get("modelNumber")??"").trim().slice(0,100);
  const releaseDate=String(form.get("releaseDate")??"").trim();
  const nits=Number(form.get("nits"));const lux=Number(form.get("lux"));
  const notes=String(form.get("testNotes")??"").trim().slice(0,5000);
  const consent=form.get("archiveConsent")==="on";
  const {data:member,error:memberError}=await supabase.from("brands").select("id,status,bsc_code,brand_members!inner(user_id)").eq("id",brandId).eq("brand_members.user_id",user.id).maybeSingle();
  if(memberError||!member)return NextResponse.json({error:"You do not have access to this brand."},{status:403});
  if(member.status!=="verified"||!member.bsc_code)return NextResponse.json({error:"The brand must be verified and have an active BSC code before submitting a certification."},{status:400});
  if(!manufacturer||!model)return NextResponse.json({error:"Manufacturer and full model name are required."},{status:400});
  if(!Number.isFinite(nits)||nits<=0||nits>100000||!Number.isFinite(lux)||lux<=0||lux>1000000)return NextResponse.json({error:"Enter valid measured nits and lux values."},{status:400});
  if(!notes)return NextResponse.json({error:"Describe the test setup and measurement conditions."},{status:400});
  if(!consent)return NextResponse.json({error:"Please confirm the device-return and archive terms before submitting."},{status:400});
  const video=form.get("testVideo");const images=form.getAll("evidence").filter((x):x is File=>x instanceof File&&x.size>0);
  if(!(video instanceof File)||video.size===0)return NextResponse.json({error:"A complete test video is required."},{status:400});
  if(images.length<1||images.length>12)return NextResponse.json({error:"Upload between 1 and 12 evidence images or PDFs."},{status:400});
  const id=randomUUID();
  const files=[{file:video,kind:"video" as const},...images.map(file=>({file,kind:"evidence" as const}))];
  const assets=[] as Array<{application_id:string;asset_type:string;storage_path:string;original_filename:string;mime_type:string;file_size_bytes:number;uploaded_by:string;sort_order:number}>;
  for(let index=0;index<files.length;index++){
   const {file,kind}=files[index];const {ext,assetType}=validateFile(file,kind);
   const storagePath=user.id+"/"+id+"/"+randomUUID()+ext;
   const {error:uploadError}=await supabase.storage.from("sr-private").upload(storagePath,file,{contentType:file.type||"application/octet-stream",upsert:false});
   if(uploadError)throw new Error("Unable to upload evidence files. Please try again.");
   uploaded.push(storagePath);
   assets.push({application_id:id,asset_type:assetType,storage_path:storagePath,original_filename:file.name.slice(0,180),mime_type:file.type.slice(0,100),file_size_bytes:file.size,uploaded_by:user.id,sort_order:index});
  }
  const {data:createdId,error:submitError}=await supabase.rpc("submit_certification_application",{
   p_application_id:id,p_brand_id:brandId,p_manufacturer:manufacturer,p_full_model_name:model,
   p_model_number:modelNumber||null,p_release_date:releaseDate||null,p_nit_value:nits,p_lux_value:lux,
   p_test_video_path:assets[0].storage_path,p_test_method_notes:notes,p_assets:assets,
  });
  if(submitError||!createdId)throw new Error("Unable to save the certification application and evidence records. Please try again.");
  return NextResponse.json({ok:true,applicationId:id,message:"Certification application submitted for review."});
 }catch(e){
  if(uploaded.length)await supabase.storage.from("sr-private").remove(uploaded);
  return NextResponse.json({error:e instanceof Error?e.message:"Unable to submit application."},{status:400});
 }
}
