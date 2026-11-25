import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const resend = body.resend === true;
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const supabase = await createClient();
    if (resend) {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) {
        const message = error.message.toLowerCase();
        if (message.includes("rate") || message.includes("limit")) {
          return NextResponse.json({ error: "Too many verification requests. Please try again later." }, { status: 429 });
        }
        return NextResponse.json({ error: "Unable to resend the verification code." }, { status: 502 });
      }
      return NextResponse.json({ ok: true, message: "A new verification code has been sent." });
    }

    if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) {
      return NextResponse.json({ error: "Choose a username with 3–30 letters, numbers, dots, underscores or hyphens." }, { status: 400 });
    }
    if (password.length < 10) {
      return NextResponse.json({ error: "Password must be at least 10 characters." }, { status: 400 });
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: username } },
    });
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("duplicate key") || message.includes("profiles_username_key")) {
        return NextResponse.json({ error: "That username is already in use. Choose another one." }, { status: 409 });
      }
      if (message.includes("rate") || message.includes("limit")) {
        return NextResponse.json({ error: "Too many verification requests. Please try again later." }, { status: 429 });
      }
      return NextResponse.json({ error: "We could not send the verification email. Please try again later." }, { status: 502 });
    }
    if (data.user && data.user.identities?.length === 0) {
      return NextResponse.json({ error: "This email is already registered. Please sign in instead." }, { status: 409 });
    }
    return NextResponse.json({ ok: true, message: "A verification code has been sent to your email." });
  } catch {
    return NextResponse.json({ error: "Unable to send a verification code." }, { status: 500 });
  }
}
