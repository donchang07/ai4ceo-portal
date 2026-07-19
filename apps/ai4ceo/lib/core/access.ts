// Design Ref: PRD 1.7 — 상태 기반 화면 개방 매트릭스

export type Role = "guest" | "applicant" | "student" | "assistant" | "alumni" | "admin";
export type EnrollmentStatus =
  | "invited"
  | "invoiced"
  | "paid"
  | "enrolled"
  | "in_training"
  | "completed"
  | "dropped";

export const IN_TRAINING: EnrollmentStatus[] = ["enrolled", "in_training"];

export function canAccessLms(role: Role, status?: EnrollmentStatus | null): boolean {
  if (role === "admin" || role === "assistant") return true;
  return !!status && (IN_TRAINING.includes(status) || status === "in_training");
}

export function canAccessAlumni(role: Role, status?: EnrollmentStatus | null): boolean {
  if (role === "admin") return true;
  return role === "alumni" || status === "completed";
}

// 세션·강의영상·자료 열람: 재학 중이거나, 졸업생 중 멤버십 가입자만 (졸업만으로는 접근 불가)
export function canAccessArchive(
  role: Role,
  status: EnrollmentStatus | null | undefined,
  hasActiveMembership: boolean,
): boolean {
  if (role === "admin" || role === "assistant") return true;
  if (canAccessLms(role, status)) return true;
  return canAccessAlumni(role, status) && hasActiveMembership;
}

export function isAdmin(role?: Role | null): boolean {
  return role === "admin";
}
