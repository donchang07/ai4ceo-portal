import { requireAlumniAccess } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { DirectoryView, type DirectoryRow } from "./directory-view";

// Design Ref: prd-v3-cycle5.design.md §4 — E-10 동문 디렉토리
export default async function AlumniDirectoryPage() {
  await requireAlumniAccess();

  let rows: DirectoryRow[] = [];
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb
      .from("alumni_profiles")
      .select(
        "user_id, display_name, job_title, company_name, bio, expertise, cohort_label, homepage_url",
      )
      .in("visibility", ["alumni_only", "public"])
      .order("updated_at", { ascending: false });
    rows = (data as DirectoryRow[]) ?? [];
  } catch {
    /* 스키마 미적용 환경 — 빈 목록으로 렌더 */
  }

  return <DirectoryView rows={rows} />;
}
