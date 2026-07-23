import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/db/auth";
import { isAdmin } from "@/lib/core/access";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { CohortsTable, type CohortRow } from "./cohorts-table";

// Design Ref: prd-v3-cycle4.design.md §3 — H-1(운영 대시보드 일부) /admin/cohorts
export default async function AdminCohortsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role)) redirect("/portal/cohort");

  let rows: CohortRow[] = [];
  try {
    const sb = await getSupabaseServer();
    const { data: cohorts } = await sb
      .from("cohorts")
      .select("id, name, recruit_start, recruit_end, edu_start, edu_end, capacity, status")
      .order("edu_start", { ascending: false });
    const cohortList = cohorts ?? [];

    const counts = new Map<string, number>();
    if (cohortList.length > 0) {
      const { data: enrollments } = await sb
        .from("enrollments")
        .select("cohort_id")
        .in(
          "cohort_id",
          cohortList.map((c) => c.id),
        );
      for (const e of enrollments ?? []) {
        counts.set(e.cohort_id, (counts.get(e.cohort_id) ?? 0) + 1);
      }
    }
    rows = cohortList.map((c) => ({ ...c, enrolledCount: counts.get(c.id) ?? 0 }));
  } catch {
    /* 스키마 미적용 환경 — 빈 목록으로 렌더 */
  }

  return (
    <AdminShell>
      <SectionTitle>기수 관리</SectionTitle>
      <p className="mt-1 text-sm text-muted">모든 기수의 모집·개강 일정과 등록 현황을 확인합니다.</p>
      <div className="mt-6">
        <CohortsTable rows={rows} />
      </div>
    </AdminShell>
  );
}
