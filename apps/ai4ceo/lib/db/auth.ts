import { redirect } from "next/navigation";
import { getSupabaseServer } from "./supabase-server";
import { ADMIN_EMAIL } from "../core/constants";
import { canAccessAlumni, canAccessLms, isAdmin, type EnrollmentStatus, type Role } from "../core/access";

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

// Design Ref: PRD 1.7 — 상태 기반 화면 개방. 결제/수강 단계별로 접근 가능한 화면이 달라야 한다
// (돈이 걸린 게이팅이므로 모든 /portal, /alumni 페이지는 아래 requireXxx 중 하나를 반드시 호출해야 한다).
function fallbackPath(user: CurrentUser): string {
  return user.enrollmentStatus ? "/portal/billing" : "/";
}

// 재학 중(enrolled/in_training) 또는 admin/assistant만 — 대화방·과제·AI조교 등 인터랙티브 LMS
export async function requireLmsAccess(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isAdmin(user.role)) return user;
  if (!canAccessLms(user.role, user.enrollmentStatus)) redirect(fallbackPath(user));
  return user;
}

// 재학생 + 수료생/동문(읽기 전용 아카이브) — 세션·자료 열람
export async function requireArchiveAccess(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isAdmin(user.role)) return user;
  if (!canAccessLms(user.role, user.enrollmentStatus) && !canAccessAlumni(user.role, user.enrollmentStatus)) {
    redirect(fallbackPath(user));
  }
  return user;
}

// 합격 후(초대~입금~등록 어느 단계든 enrollment 레코드가 있는) 누구나 — 결제/인보이스 확인
export async function requireBillingAccess(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isAdmin(user.role)) return user;
  if (!user.enrollmentStatus) redirect("/apply");
  return user;
}

// 수료생(alumni) 또는 admin만 — AS Q&A, 오피스아워, 멤버십
export async function requireAlumniAccess(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isAdmin(user.role)) return user;
  if (!canAccessAlumni(user.role, user.enrollmentStatus)) redirect(fallbackPath(user));
  return user;
}
