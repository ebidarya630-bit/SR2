import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("rate") || message.includes("limit")) {
        return NextResponse.json({ error: "Too many verification requests. Please try again later." }, { status: 429 });
      }
      return NextResponse.json({ error: "We could not send the verification email. Please try again later." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, message: "A verification code has been sent to your email. It expires according to the Supabase Auth email settings." });
  } catch {
    return NextResponse.json({ error: "Unable to send a verification code." }, { status: 500 });
  }
}
