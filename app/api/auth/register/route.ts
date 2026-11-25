import { NextResponse } from "next/server";
import { randomUUID, createHash, timingSafeEqual } from "node:crypto";
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
    const code = String(body.code ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({error:"Enter a valid email address."},{status:400});
    if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) return NextResponse.json({error:"Username must be 3–30 characters (letters, numbers, dot, underscore or hyphen)."}, {status:400});
    if (password.length < 10) return NextResponse.json({error:"Password must be at least 10 characters."},{status:400});
    if (!/^\d{6}$/.test(code)) return NextResponse.json({error:"Enter the 6-digit email verification code."},{status:400});
    const verification = db.prepare("SELECT id,code_hash,expires_at,attempts FROM email_verification_codes WHERE email=? AND purpose='register' AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1").get(email) as {id:string;code_hash:string;expires_at:string;attempts:number}|undefined;
    if (!verification || new Date(verification.expires_at).getTime() < Date.now() || verification.attempts >= 5) return NextResponse.json({error:"Verification code expired or unavailable. Request a new code."},{status:400});
    const expected = createHash("sha256").update((process.env.SESSION_SECRET||"")+":"+email+":"+code).digest("hex");
    const valid = expected.length === verification.code_hash.length && timingSafeEqual(Buffer.from(expected),Buffer.from(verification.code_hash));
    if (!valid) { db.prepare("UPDATE email_verification_codes SET attempts=attempts+1 WHERE id=?").run(verification.id); return NextResponse.json({error:"The verification code is incorrect."},{status:400}); }
    const id = randomUUID();
    const hash = await bcrypt.hash(password, 12);
    try {
      const create = db.transaction(() => {
        db.prepare("INSERT INTO users(id,email,username,password_hash) VALUES(?,?,?,?)").run(id,email,username,hash);
        db.prepare("UPDATE email_verification_codes SET consumed_at=CURRENT_TIMESTAMP WHERE id=?").run(verification.id);
      });
      create();
    } catch { return NextResponse.json({error:"That email or username is already registered."},{status:409}); }
    await createSession({id,email,username,role:"user"});
    return NextResponse.json({ok:true});
  } catch { return NextResponse.json({error:"Registration could not be completed."},{status:500}); }
}
