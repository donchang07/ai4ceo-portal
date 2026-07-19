import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { SUPABASE_CONFIGURED } from "@/lib/db/env";
import { isAdmin, type Role } from "@/lib/core/access";

// Design Ref: PRD 1.7/2.2 — /admin/* requires role=admin (server-side gate)
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!SUPABASE_CONFIGURED) return children;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!isAdmin(profile?.role as Role | undefined)) redirect("/portal/cohort");

  return children;
}
