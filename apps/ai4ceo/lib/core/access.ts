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

export function isAdmin(role?: Role | null): boolean {
  return role === "admin";
}
