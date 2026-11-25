import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const code = String(body.code ?? "").trim();

    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) return NextResponse.json({ error: "Username must be 3–30 characters (letters, numbers, dot, underscore or hyphen)." }, { status: 400 });
    if (password.length < 10) return NextResponse.json({ error: "Password must be at least 10 characters." }, { status: 400 });
    if (!/^\\d{6}$/.test(code)) return NextResponse.json({ error: "Enter the 6-digit email verification code." }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error || !data.user) return NextResponse.json({ error: "The verification code is invalid or expired. Request a new code." }, { status: 400 });

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ username, display_name: username })
      .eq("id", data.user.id);
    if (profileError) {
      return NextResponse.json({ error: profileError.code === "23505" ? "That username is already in use." : "Your profile could not be completed. Please contact support." }, { status: profileError.code === "23505" ? 409 : 500 });
    }

    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) return NextResponse.json({ error: "Your account was verified, but the password could not be saved. Please sign in and use password recovery." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Registration could not be completed." }, { status: 500 });
  }
}
