import { createClient } from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;const email=process.env.ADMIN_EMAIL?.trim().toLowerCase();const password=process.env.ADMIN_PASSWORD;
if(!url||!key||!email||!password)throw new Error("Set Supabase URL, service role key, ADMIN_EMAIL and ADMIN_PASSWORD in private .env.local.");
if(password.length<14)throw new Error("Admin password must be at least 14 characters.");
const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
const {data:list,error:listError}=await db.auth.admin.listUsers({page:1,perPage:1000});if(listError)throw listError;
let user=list.users.find(u=>u.email?.toLowerCase()===email);
if(!user){const {data,error}=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:"SR Administrator"}});if(error)throw error;user=data.user;}
else{const {data,error}=await db.auth.admin.updateUserById(user.id,{password,email_confirm:true});if(error)throw error;user=data.user;}
const {error}=await db.from("profiles").upsert({id:user.id,role:"admin",display_name:"SR Administrator",email_verified_at:new Date().toISOString(),is_blocked:false},{onConflict:"id"});if(error)throw error;
console.log("Admin account provisioned for "+email+". Sign in at /login. Remove ADMIN_PASSWORD from the environment after setup.");
