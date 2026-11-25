import {loadEnvConfig} from "@next/env";
import {randomUUID} from "node:crypto";
import {execFileSync} from "node:child_process";
import bcrypt from "bcryptjs";
loadEnvConfig(process.cwd());

const email=(process.env.ADMIN_EMAIL||"adminsr@gmail.com").trim().toLowerCase();
const password=process.env.ADMIN_PASSWORD;
if(!password||password.length<14)throw new Error("Set a new ADMIN_PASSWORD of at least 14 characters in your private .env.local file.");
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("ADMIN_EMAIL must be a valid email address.");

const id=randomUUID();
const username="sr-admin";
const hash=await bcrypt.hash(password,12);
const quote=(value:string)=>"'"+value.replace(/'/g,"''")+"'";
const sql=[
 "INSERT OR IGNORE INTO users(id,email,username,password_hash,role) VALUES("+[quote(id),quote(email),quote(username),quote(hash),"'admin'"].join(",")+");",
 "UPDATE users SET password_hash="+quote(hash)+",role='admin',is_blocked=0,blocked_reason=NULL WHERE email="+quote(email)+";",
 "INSERT INTO admin_audit_logs(admin_id,action,target_type,target_id,details) SELECT id,'admin_provisioned','user',id,"+quote(JSON.stringify({email}))+" FROM users WHERE email="+quote(email)+";"
].join("\n");

execFileSync("npx",["wrangler","d1","execute","sr2-production","--remote","--command",sql],{stdio:"inherit"});
console.log("Administrator account provisioned in Cloudflare D1:",email);
