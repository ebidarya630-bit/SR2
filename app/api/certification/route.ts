import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import path from "node:path";
import {getCloudflareContext} from "@opennextjs/cloudflare";
import {getSession} from "@/lib/auth";
import {first,batch} from "@/lib/db";
export const runtime="nodejs";
const MAX_FILE=60*1024*1024;
type EvidenceBucket={put(key:string,value:ArrayBuffer|ArrayBufferView|ReadableStream,options?:{httpMetadata?:{contentType?:string}}):Promise<unknown>;delete(key:string):Promise<void>};
function bucket(){return (getCloudflareContext().env as unknown as {SR2_EVIDENCE:EvidenceBucket}).SR2_EVIDENCE;}
async function saveFile(file:File,kind:string,applicationId:string){
 if(file.size>MAX_FILE)throw new Error("Each uploaded file must be 60 MB or smaller.");
 const ext=path.extname(file.name).toLowerCase();
 const allowed=kind==="video"?[".mp4",".mov",".webm"]:[".jpg",".jpeg",".png",".webp",".pdf"];
 if(!allowed.includes(ext))throw new Error("Unsupported file type: "+file.name);
 const key="applications/"+applicationId+"/"+randomUUID()+ext;
 await bucket().put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type||"application/octet-stream"}});
 return {storedPath:key,originalName:file.name.slice(0,180),mimeType:file.type.slice(0,100),size:file.size,kind};
}
export async function POST(request:Request){
 const user=await getSession();if(!user)return NextResponse.json({error:"Please sign in first."},{status:401});
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
  const consent=form.get("archiveConsent")==="on"?1:0;
  const member=await first<{id:string;status:string;bsc_code:string|null}>("SELECT b.id,b.status,b.bsc_code FROM brands b JOIN brand_members m ON m.brand_id=b.id WHERE b.id=? AND m.user_id=?",brandId,user.id);
  if(!member)return NextResponse.json({error:"You do not have access to this brand."},{status:403});
  if(member.status!=="verified"||!member.bsc_code)return NextResponse.json({error:"The brand must be verified and have an active BSC code before submitting a certification."},{status:400});
  if(!manufacturer||!model)return NextResponse.json({error:"Manufacturer and full model name are required."},{status:400});
  if(!Number.isFinite(nits)||nits<=0||nits>100000||!Number.isFinite(lux)||lux<=0||lux>1000000)return NextResponse.json({error:"Enter valid measured nits and lux values."},{status:400});
  if(!notes)return NextResponse.json({error:"Describe the test setup and measurement conditions."},{status:400});
  if(!consent)return NextResponse.json({error:"Please confirm the device-return and archive terms before submitting."},{status:400});
  const video=form.get("testVideo");const images=form.getAll("evidence").filter((x):x is File=>x instanceof File&&x.size>0);
  if(!(video instanceof File)||video.size===0)return NextResponse.json({error:"A complete test video is required."},{status:400});
  if(images.length<1||images.length>12)return NextResponse.json({error:"Upload between 1 and 12 evidence images or PDFs."},{status:400});
  const id=randomUUID();const saved:Array<{storedPath:string;originalName:string;mimeType:string;size:number;kind:string}>=[];
  saved.push(await saveFile(video,"video",id));uploaded.push(saved[0].storedPath);
  for(const file of images){const item=await saveFile(file,"evidence",id);saved.push(item);uploaded.push(item.storedPath);}
  const statements=[
   {sql:"INSERT INTO certification_applications(id,brand_id,submitted_by,manufacturer,full_model_name,model_number,release_date,nit_value,lux_value,test_video_path,test_method_notes,status,archive_device_consent) VALUES(?,?,?,?,?,?,?,?,?,?,?,'submitted',?)",values:[id,brandId,user.id,manufacturer,model,modelNumber||null,releaseDate||null,nits,lux,saved[0].storedPath,notes,consent]},
   ...saved.map(item=>({sql:"INSERT INTO application_assets(id,application_id,kind,storage_path,original_name,mime_type,file_size) VALUES(?,?,?,?,?,?,?)",values:[randomUUID(),id,item.kind,item.storedPath,item.originalName,item.mimeType,item.size]}))
  ];
  await batch(statements);
  return NextResponse.json({ok:true,applicationId:id,message:"Certification application submitted for review."});
 }catch(e){
  if(uploaded.length)await bucket().delete(uploaded).catch(()=>undefined);
  return NextResponse.json({error:e instanceof Error?e.message:"Unable to submit application."},{status:400});
 }
}
