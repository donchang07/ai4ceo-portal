import { requireLmsAccess } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { BuildsView, type BuildRow } from "./builds-view";

// Design Ref: prd-v30-remaining.design.md §4 F3 — SCR-05 결과물 등록·회사 적용 추적 (US-06)
export default async function BuildsPage() {
  const user = await requireLmsAccess();

  let builds: BuildRow[] = [];
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb
      .from("builds")
      .select("id, title, description, repo_url, apply_status, effect_memo, visibility, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    builds = (data as BuildRow[]) ?? [];
  } catch {
    /* 스키마 미적용 환경 — 빈 목록으로 렌더 */
  }

  return <BuildsView userId={user.id} initialBuilds={builds} />;
}
