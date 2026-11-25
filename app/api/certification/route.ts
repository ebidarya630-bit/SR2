import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {getSession} from "@/lib/auth";
import {db} from "@/lib/db";
export const runtime="nodejs";
const MAX_FILE=60*1024*1024;
async function saveFile(file:File,kind:string,applicationId:string){
 if(file.size>MAX_FILE)throw new Error("Each uploaded file must be 60 MB or smaller.");
 const ext=path.extname(file.name).toLowerCase();
 const allowed=kind==="video"?[".mp4",".mov",".webm"]:[".jpg",".jpeg",".png",".webp",".pdf"];
 if(!allowed.includes(ext))throw new Error("Unsupported file type: "+file.name);
 const dir=path.join(process.env.UPLOADS_DIR||path.join(process.cwd(),"data","uploads"),applicationId);
 await fs.mkdir(dir,{recursive:true});
 const filename=randomUUID()+ext;
 await fs.writeFile(path.join(dir,filename),Buffer.from(await file.arrayBuffer()),{flag:"wx"});
 return {storedPath:path.join("uploads",applicationId,filename),originalName:file.name.slice(0,180),mimeType:file.type.slice(0,100),size:file.size,kind};
}
export async function POST(request:Request){
 const user=await getSession();if(!user)return NextResponse.json({error:"Please sign in first."},{status:401});
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
  const member=db.prepare("SELECT b.id,b.status,b.bsc_code FROM brands b JOIN brand_members m ON m.brand_id=b.id WHERE b.id=? AND m.user_id=?").get(brandId,user.id) as {id:string;status:string;bsc_code:string|null}|undefined;
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
  try{
   saved.push(await saveFile(video,"video",id));
   for(const file of images)saved.push(await saveFile(file,"evidence",id));
   const insert=db.transaction(()=>{
    db.prepare("INSERT INTO certification_applications(id,brand_id,submitted_by,manufacturer,full_model_name,model_number,release_date,nit_value,lux_value,test_video_path,test_method_notes,status,archive_device_consent) VALUES(?,?,?,?,?,?,?,?,?,?,?,'submitted',?)").run(id,brandId,user.id,manufacturer,model,modelNumber||null,releaseDate||null,nits,lux,saved[0].storedPath,notes,consent);
    const asset=db.prepare("INSERT INTO application_assets(id,application_id,kind,storage_path,original_name,mime_type,file_size) VALUES(?,?,?,?,?,?,?)");
    for(const item of saved)asset.run(randomUUID(),id,item.kind,item.storedPath,item.originalName,item.mimeType,item.size);
   });
   insert();
  }catch(e){await fs.rm(path.join(process.env.UPLOADS_DIR||path.join(process.cwd(),"data","uploads"),id),{recursive:true,force:true});throw e;}
  return NextResponse.json({ok:true,applicationId:id,message:"Certification application submitted for review."});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to submit application."},{status:400});}
}
