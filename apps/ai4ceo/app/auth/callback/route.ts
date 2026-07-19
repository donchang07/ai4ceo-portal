import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/db/supabase-server";

// Design Ref: §5 — magic link callback: exchange code for session
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/portal/cohort";

  if (code) {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Design Ref: PRD 2.2 RBAC — ensure a profiles row exists on first login.
        // ignoreDuplicates so an existing role (e.g. admin) is never demoted.
        await supabase
          .from("profiles")
          .upsert(
            { id: user.id, name: user.user_metadata?.name ?? null },
            { onConflict: "id", ignoreDuplicates: true }
          );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
