import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({error:"Enter a valid email address."},{status:400});
    if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) return NextResponse.json({error:"Username must be 3–30 characters (letters, numbers, dot, underscore or hyphen)."}, {status:400});
    if (password.length < 10) return NextResponse.json({error:"Password must be at least 10 characters."},{status:400});
    const id = randomUUID();
    const hash = await bcrypt.hash(password, 12);
    try {
      db.prepare("INSERT INTO users(id,email,username,password_hash) VALUES(?,?,?,?)").run(id,email,username,hash);
    } catch { return NextResponse.json({error:"That email or username is already registered."},{status:409}); }
    await createSession({id,email,username,role:"user"});
    return NextResponse.json({ok:true});
  } catch { return NextResponse.json({error:"Registration could not be completed."},{status:500}); }
}
