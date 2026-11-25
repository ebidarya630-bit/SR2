"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";
type Brand={id:string;legalName:string;displayName:string;officialEmail:string;websiteUrl:string|null;bscCode:string|null;status:string;createdAt:string};
type Application={id:string;brandId:string;modelName:string;manufacturer:string;modelNumber:string|null;status:string;createdAt:string};

const MAX_UPLOAD_FILE=50*1024*1024;
const MAX_UPLOAD_TOTAL=100*1024*1024;
const MIME_BY_EXTENSION:Record<string,string>={mp4:"video/mp4",mov:"video/quicktime",webm:"video/webm",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",pdf:"application/pdf"};
async function uploadResumable(file:File,path:string,contentType:string,accessToken:string,onProgress:(uploaded:number,total:number)=>void):Promise<void>{
 const tus=await import("tus-js-client");
 const projectUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const apiKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!projectUrl||!apiKey)throw new Error("Supabase upload settings are missing.");
 const storageHost=new URL(projectUrl).hostname.replace(".supabase.co",".storage.supabase.co");
 return new Promise((resolve,reject)=>{
  const upload=new tus.Upload(file,{
   endpoint:"https://"+storageHost+"/storage/v1/upload/resumable",
   headers:{authorization:"Bearer "+accessToken,apikey:apiKey},
   metadata:{bucketName:"sr-private",objectName:path,contentType,cacheControl:"3600"},
   chunkSize:6*1024*1024,
   retryDelays:[0,3000,5000,10000,20000],
   uploadDataDuringCreation:true,
   removeFingerprintOnSuccess:true,
   onError:reject,
   onProgress,
   onSuccess:()=>resolve(),
  });
  upload.findPreviousUploads().then(previous=>{
   if(previous.length)upload.resumeFromPreviousUpload(previous[0]);
   upload.start();
  }).catch(reject);
 });
}

export default function Brand(){
 const[brands,setBrands]=useState<Brand[]>([]);const[apps,setApps]=useState<Application[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState("");const[message,setMessage]=useState("");
 const[legalName,setLegal]=useState("");const[displayName,setDisplay]=useState("");const[officialEmail,setEmail]=useState("");const[websiteUrl,setWebsite]=useState("");const[foundedOn,setFounded]=useState("");
 const[brandId,setBrandId]=useState("");const[manufacturer,setManufacturer]=useState("");const[modelName,setModel]=useState("");const[modelNumber,setModelNumber]=useState("");const[releaseDate,setRelease]=useState("");const[nits,setNits]=useState("");const[lux,setLux]=useState("");const[testNotes,setNotes]=useState("");const[archiveConsent,setConsent]=useState(false);const[testVideo,setVideo]=useState<File|null>(null);const[evidence,setEvidence]=useState<FileList|null>(null);const[busy,setBusy]=useState(false);const[uploadProgress,setUploadProgress]=useState<number|null>(null);
 async function refresh(){const r=await fetch("/api/brand");if(r.status===401){window.location.href="/login";return;}const d=await r.json();if(!r.ok)throw new Error(d.error);setBrands(d.brands);setApps(d.applications);setLoading(false);}
 useEffect(()=>{refresh().catch(e=>{setError(e.message);setLoading(false);});},[]);
 async function register(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");setMessage("");try{const r=await fetch("/api/brand/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({legalName,displayName,officialEmail,websiteUrl,foundedOn})});const d=await r.json();if(!r.ok)throw new Error(d.error);setMessage(d.message);setLegal("");setDisplay("");setEmail("");setWebsite("");setFounded("");await refresh();}catch(e){setError(e instanceof Error?e.message:"Request failed");}finally{setBusy(false);}}
 async function apply(e:React.FormEvent){
  e.preventDefault();const formElement=e.currentTarget as HTMLFormElement;setBusy(true);setError("");setMessage("");setUploadProgress(0);
  const supabase=createClient();const uploadedPaths:string[]=[];
  try{
   if(!testVideo||!evidence||evidence.length<1)throw new Error("Choose a test video and at least one evidence file.");
   const selected=[{file:testVideo,kind:"video" as const},...Array.from(evidence).map(file=>({file,kind:"evidence" as const}))];
   if(selected.length>13)throw new Error("Upload no more than 12 evidence files.");
   const totalBytes=selected.reduce((sum,item)=>sum+item.file.size,0);
   if(totalBytes>MAX_UPLOAD_TOTAL)throw new Error("The combined upload size must be 100 MB or smaller.");
   const assets=selected.map((item,index)=>{
    const extension=item.file.name.split(".").pop()?.toLowerCase()??"";
    const expected=MIME_BY_EXTENSION[extension];
    if(!expected||(item.kind==="video"?!["mp4","mov","webm"].includes(extension):!["jpg","jpeg","png","webp","pdf"].includes(extension)))throw new Error("Unsupported evidence file: "+item.file.name);
    if(item.file.size<1||item.file.size>MAX_UPLOAD_FILE)throw new Error("Each uploaded file must be 50 MB or smaller.");
    if(item.file.type&&item.file.type!=="application/octet-stream"&&item.file.type!==expected)throw new Error("The file type does not match its extension: "+item.file.name);
    return {file:item.file,assetType:item.kind==="video"?"test_video" as const:"supporting_file" as const,contentType:expected,sortOrder:index};
   });
   const {data:{user},error:userError}=await supabase.auth.getUser();
   if(userError||!user)throw new Error("Your session expired. Sign in again.");
   const {data:{session},error:sessionError}=await supabase.auth.getSession();
   if(sessionError||!session?.access_token)throw new Error("Your session expired. Sign in again.");
   const applicationId=crypto.randomUUID();let completedBytes=0;
   const records=[];
   for(const asset of assets){
    const storagePath=user.id+"/"+applicationId+"/"+crypto.randomUUID()+"."+asset.file.name.split(".").pop()!.toLowerCase();
    await uploadResumable(asset.file,storagePath,asset.contentType,session.access_token,(uploaded,total)=>{
     setUploadProgress(Math.min(99,Math.round(((completedBytes+uploaded)/totalBytes)*100)));
    });
    uploadedPaths.push(storagePath);
    records.push({application_id:applicationId,asset_type:asset.assetType,storage_path:storagePath,original_filename:asset.file.name.slice(0,180),mime_type:asset.contentType,file_size_bytes:asset.file.size,uploaded_by:user.id,sort_order:asset.sortOrder});
    completedBytes+=asset.file.size;
   }
   const response=await fetch("/api/certification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({applicationId,brandId,manufacturer,modelName,modelNumber,releaseDate,nits,lux,testNotes,archiveConsent,testVideoPath:records[0].storage_path,assets:records})});
   const result=await response.json();if(!response.ok)throw new Error(result.error||"Unable to submit application.");
   setUploadProgress(100);setMessage(result.message);setModel("");setModelNumber("");setRelease("");setNits("");setLux("");setNotes("");setVideo(null);setEvidence(null);setConsent(false);uploadedPaths.length=0;formElement.reset();await refresh();
  }catch(error){
   if(uploadedPaths.length)await supabase.storage.from("sr-private").remove(uploadedPaths);
   setError(error instanceof Error?error.message:"Request failed");
  }finally{setBusy(false);setUploadProgress(null);}
 }
 const field=(label:string,value:string,set:(v:string)=>void,type="text",required=true)=><div className="field"><label>{label}</label><input type={type} required={required} value={value} onChange={e=>set(e.target.value)}/></div>;
 return <main className="shell dashboard"><Link className="logo" href="/">SR<span>.</span></Link><div className="eyebrow" style={{marginTop:48}}>Manufacturer workspace</div><h1>Brand portal</h1><p className="muted">Register your company, request BSC verification and submit smartphone display test evidence.</p>{error&&<p className="error">{error}</p>}{message&&<p className="success">{message}</p>}
 <section className="section"><h2>Your brands</h2>{loading?<p className="muted">Loading…</p>:brands.length===0?<p className="muted">No brand profiles yet. Register your organization below.</p>:<div className="cards">{brands.map(b=><article className="card" key={b.id}><h3>{b.displayName}</h3><p>{b.legalName}</p><p className="muted">{b.officialEmail}</p><p>Status: <strong>{b.status}</strong></p><p>BSC: {b.bscCode??"Pending review"}</p></article>)}</div>}</section>
 <section className="section"><div className="card"><h2>Register a brand</h2><p className="muted">Use an official company email. Registration automatically creates a manual BSC verification request. A submitted brand is not verified until an administrator reviews it.</p><form onSubmit={register}>{field("Legal company name",legalName,setLegal)}{field("Public brand name",displayName,setDisplay)}{field("Official company email",officialEmail,setEmail,"email")}{field("Official website (optional)",websiteUrl,setWebsite,"url",false)}{field("Founded date (optional)",foundedOn,setFounded,"date",false)}<button className="btn" disabled={busy}>Submit brand for review</button></form></div></section>
 <section className="section"><div className="card"><h2>Submit a phone for SR testing</h2><p className="muted">Only verified brands with a BSC code can submit. Required: complete test video, supporting evidence, measured brightness and illuminance, and test notes.</p>{brands.some(b=>b.status==="verified"&&b.bscCode)?<form onSubmit={apply}><div className="field"><label>Verified brand</label><select required value={brandId} onChange={e=>setBrandId(e.target.value)}><option value="">Choose brand</option>{brands.filter(b=>b.status==="verified"&&b.bscCode).map(b=><option key={b.id} value={b.id}>{b.displayName} · {b.bscCode}</option>)}</select></div>{field("Manufacturer",manufacturer,setManufacturer)}{field("Full phone model name",modelName,setModel)}{field("Model number",modelNumber,setModelNumber,"text",false)}{field("Release date",releaseDate,setRelease,"date",false)}{field("Measured peak brightness (nits)",nits,setNits,"number")}{field("Ambient illuminance (lux)",lux,setLux,"number")}<div className="field"><label>Test method and conditions</label><textarea required rows={5} value={testNotes} onChange={e=>setNotes(e.target.value)}/></div><div className="field"><label>Complete test video (MP4, MOV or WebM; max 50 MB)</label><input required type="file" accept="video/mp4,video/quicktime,video/webm" onChange={e=>setVideo(e.target.files?.[0]??null)}/></div><div className="field"><label>Evidence files (1–12 images or PDFs; max 50 MB each)</label><input required multiple type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setEvidence(e.target.files)}/></div><label style={{display:"flex",gap:10,alignItems:"flex-start",lineHeight:1.5,margin:"20px 0"}}><input type="checkbox" checked={archiveConsent} onChange={e=>setConsent(e.target.checked)}/> I understand that if I voluntarily ship a physical test device under the separate device-submission agreement, it will not be returned and may be retained in the Saturn Studio archive. This checkbox records consent for this application; shipping is optional and separate written terms must be accepted before shipment.</label>{uploadProgress!==null&&<p className="muted" role="status">Uploading evidence: {uploadProgress}%</p>}<button className="btn" disabled={busy}>Submit certification application</button></form>:<p className="muted">No verified brand with a BSC code is linked to your account yet. Submit a brand registration first.</p>}</div></section>
 <section className="section"><h2>Certification applications</h2>{apps.length===0?<p className="muted">No applications submitted yet.</p>:<div className="cards">{apps.map(a=><article className="card" key={a.id}><h3>{a.manufacturer} {a.modelName}</h3><p className="muted">{a.modelNumber??"Model number not provided"}</p><p>Status: <strong>{a.status}</strong></p><small className="muted">{new Date(a.createdAt).toLocaleDateString()}</small></article>)}</div>}</section>
 <p className="muted">Questions? <a href="mailto:bscmailcode@gmail.com">bscmailcode@gmail.com</a> · 10:00–22:00 Iran time.</p></main>;
}
