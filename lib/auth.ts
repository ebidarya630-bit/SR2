import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  role: "user" | "brand" | "admin";
  is_blocked: boolean;
};

export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || !user.email) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, role, is_blocked")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || profile.is_blocked) return null;
  return {
    id: user.id,
    email: user.email,
    username: profile.username ?? "",
    role: profile.role,
    is_blocked: profile.is_blocked,
  };
}

export async function clearSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
