import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { first } from "@/lib/db";

const COOKIE = "sr_session";
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be set to a random value of at least 32 characters.");
  return new TextEncoder().encode(value);
}
export type SessionUser = { id: string; email: string; username: string; role: string; is_blocked: number };
export async function createSession(user: {id:string;email:string;username:string;role:string}) {
  const token = await new SignJWT({ email:user.email, username:user.username, role:user.role })
    .setProtectedHeader({alg:"HS256"}).setSubject(user.id).setIssuedAt().setExpirationTime("7d").sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*7});
}
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const {payload} = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const user = await first<SessionUser>("SELECT id,email,username,role,is_blocked FROM users WHERE id=?", payload.sub);
    if (!user || user.is_blocked) return null;
    return user;
  } catch { return null; }
}
export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE, "", {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});
}
