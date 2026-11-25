import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role,is_blocked").eq("id", data.user.id).maybeSingle();
    if (profileError || !profile || profile.is_blocked) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "This account is unavailable. Contact support." }, { status: 403 });
    }
    return NextResponse.json({ ok: true, role: profile.role });
  } catch {
    return NextResponse.json({ error: "Sign in is temporarily unavailable." }, { status: 500 });
  }
}
