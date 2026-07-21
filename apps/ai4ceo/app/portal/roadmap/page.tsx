import { requireLmsAccess } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { RoadmapView, type RoadmapRow, type BuildOption } from "./roadmap-view";

// Design Ref: prd-v30-remaining.design.md §4 F5 — SCR-08 AX 로드맵 (US-09)
export default async function RoadmapPage() {
  const user = await requireLmsAccess();

  let roadmap: RoadmapRow | null = null;
  let builds: BuildOption[] = [];
  try {
    const sb = await getSupabaseServer();
    const [{ data: rm }, { data: bs }] = await Promise.all([
      sb
        .from("roadmaps")
        .select("status, diagnosis, priorities, plan_90d, expansion, build_ids")
        .eq("user_id", user.id)
        .maybeSingle(),
      sb.from("builds").select("id, title").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    roadmap = (rm as RoadmapRow) ?? null;
    builds = (bs as BuildOption[]) ?? [];
  } catch {
    /* 스키마 미적용 환경 — 빈 로드맵으로 렌더 */
  }

  return (
    <RoadmapView
      userId={user.id}
      cohortId={user.cohortId}
      userName={user.name}
      initial={roadmap}
      builds={builds}
    />
  );
}
