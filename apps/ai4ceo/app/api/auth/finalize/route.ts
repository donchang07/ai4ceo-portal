import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabase-server";

export async function POST() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await supabase
    .from("profiles")
    .upsert(
      { id: user.id, name: user.user_metadata?.name ?? null },
      { onConflict: "id", ignoreDuplicates: true }
    );

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_password")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({ hasPassword: !!profile?.has_password });
}
