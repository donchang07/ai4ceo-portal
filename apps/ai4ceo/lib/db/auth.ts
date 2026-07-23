import { redirect } from "next/navigation";
import { cache } from "react";
import { headers } from "next/headers";
import { getSupabaseServer } from "./supabase-server";
import { ADMIN_EMAIL } from "../core/constants";
import {
  canAccessAlumni,
  canAccessArchive,
  canAccessLms,
  isAdmin,
  type EnrollmentStatus,
  type Role,
} from "../core/access";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  enrollmentStatus: EnrollmentStatus | null;
  cohortId: string | null;
  hasActiveMembership: boolean;
}

// Design Ref: §5 — resolve current user (profile.role + enrollment.status)
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const supabase = await getSupabaseServer();
    const requestHeaders = await headers();
    let id = requestHeaders.get("x-ai4ceo-user-id") ?? "";
    let email = requestHeaders.get("x-ai4ceo-user-email") ?? "";
    if (!id) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      id = user.id;
      email = user.email ?? "";
    }

    const { data } = await supabase.rpc("current_user_context").maybeSingle();
    const context = data as {
      name: string | null;
      role: string | null;
      enrollment_status: string | null;
      cohort_id: string | null;
      has_active_membership: boolean;
    } | null;
    if (!context) return null;
    const role: Role =
      (context.role as Role) ?? (email === ADMIN_EMAIL ? "admin" : "applicant");

    return {
      id,
      email,
      name: context.name ?? email.split("@")[0] ?? "회원",
      role,
      enrollmentStatus: (context.enrollment_status as EnrollmentStatus) ?? null,
      cohortId: context.cohort_id ?? null,
      hasActiveMembership: !!context.has_active_membership,
    };
  } catch {
    return null;
  }
});

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

// 재학생, 또는 졸업생 중 멤버십 가입자만 — 세션·강의영상·자료 열람 (졸업만으로는 접근 불가)
export async function requireArchiveAccess(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isAdmin(user.role)) return user;
  if (!canAccessArchive(user.role, user.enrollmentStatus, user.hasActiveMembership)) {
    // 졸업생인데 멤버십이 없는 경우 멤버십 안내 화면으로, 그 외는 기존 fallback
    if (canAccessAlumni(user.role, user.enrollmentStatus)) redirect("/alumni/membership");
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
