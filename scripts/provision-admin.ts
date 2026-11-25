import {loadEnvConfig} from "@next/env";
import {createClient} from "@supabase/supabase-js";
loadEnvConfig(process.cwd());

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SECRET_KEY;
const email=(process.env.ADMIN_EMAIL||"").trim().toLowerCase();
const password=process.env.ADMIN_PASSWORD;
if(!url||!key)throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in the private environment.");
if(!email)throw new Error("Set ADMIN_EMAIL in the private environment.");
if(!password||password.length<14)throw new Error("Set a one-time ADMIN_PASSWORD of at least 14 characters in the private environment.");

const supabase=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
const {data:existing,error:listError}=await supabase.auth.admin.listUsers({page:1,perPage:1000});
if(listError)throw listError;
let user=existing.users.find(item=>item.email?.toLowerCase()===email);
if(!user){
 const {data,error}=await supabase.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{username:"sr-admin",display_name:"SR Administrator"}});
 if(error)throw error;
 user=data.user;
}else{
 const {data,error}=await supabase.auth.admin.updateUserById(user.id,{password,email_confirm:true});
 if(error)throw error;
 user=data.user;
}
const {error:profileError}=await supabase.from("profiles").upsert({id:user.id,username:"sr-admin",display_name:"SR Administrator",role:"admin",is_blocked:false},{onConflict:"id"});
if(profileError)throw profileError;
const {error:auditError}=await supabase.from("admin_audit_logs").insert({admin_id:user.id,action:"admin_provisioned",target_type:"profile",target_id:user.id,details:{email}});
if(auditError)throw auditError;
console.log("Administrator account is ready:",email);
console.log("Remove ADMIN_PASSWORD from the environment after provisioning.");
