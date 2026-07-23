import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/db/auth";
import { isAdmin } from "@/lib/core/access";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { VersionPacksPanel, type PackRow } from "./version-packs-panel";

// Design Ref: prd-v3-cycle4.design.md §5 — H-13 (SCR /admin/version-packs)
export default async function AdminVersionPacksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role)) redirect("/portal/cohort");

  let packs: PackRow[] = [];
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb
      .from("cohort_version_packs")
      .select("id, version_label, locked_at, change_summary, created_at, cohorts(name)")
      .order("created_at", { ascending: false });
    packs = (data as unknown as PackRow[]) ?? [];
  } catch {
    /* 스키마 미적용 환경 — 빈 목록으로 렌더 */
  }

  return (
    <AdminShell>
      <SectionTitle>Cohort Version Pack 관리</SectionTitle>
      <p className="mt-1 text-sm text-muted">
        기수별 커리큘럼 스냅샷의 잠금 상태를 확인하고 관리합니다. 잠금 후 변경은 이력으로
        남습니다.
      </p>
      <div className="mt-6">
        <VersionPacksPanel packs={packs} />
      </div>
    </AdminShell>
  );
}
