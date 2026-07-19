import { getSupabaseServer } from "./supabase-server";
import { ADMIN_EMAIL } from "../core/constants";
import type { EnrollmentStatus, Role } from "../core/access";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  enrollmentStatus: EnrollmentStatus | null;
  cohortId: string | null;
}

// Design Ref: §5 — resolve current user (profile.role + enrollment.status)
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, role")
      .eq("id", user.id)
      .maybeSingle();

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("status, cohort_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const email = user.email ?? "";
    const role: Role =
      (profile?.role as Role) ?? (email === ADMIN_EMAIL ? "admin" : "applicant");

    return {
      id: user.id,
      email,
      name: profile?.name ?? email.split("@")[0] ?? "회원",
      role,
      enrollmentStatus: (enrollment?.status as EnrollmentStatus) ?? null,
      cohortId: enrollment?.cohort_id ?? null,
    };
  } catch {
    return null;
  }
}
