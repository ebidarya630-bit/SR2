import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const user = db.prepare("SELECT id,email,username,role,password_hash,is_blocked FROM users WHERE email=?").get(email) as {id:string;email:string;username:string;role:string;password_hash:string;is_blocked:number}|undefined;
    if (!user || user.is_blocked || !(await bcrypt.compare(password,user.password_hash))) return NextResponse.json({error:"Email or password is incorrect."},{status:401});
    await createSession(user);
    return NextResponse.json({ok:true,role:user.role});
  } catch { return NextResponse.json({error:"Sign in is temporarily unavailable."},{status:500}); }
}
