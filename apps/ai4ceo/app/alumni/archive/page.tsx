import { requireAlumniAccess } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { ArchiveView, type ArchiveCohort, type ArchiveSession } from "./archive-view";

// Design Ref: SCR-09 — 동문 아카이브. 멤버십 만료 후에도 목록은 열람 가능해야 하므로
// requireArchiveAccess가 아닌 requireAlumniAccess(알럼나이/admin 게이트)를 사용한다.
//
// prd-v30-final §3 F2 — 기수·주차별 녹화본·교재 탐색 추가.
// videos_read/materials_read RLS는 이미 has_active_membership()로 확장되어 있어(라이브 확인),
// 여기서는 추가 조회만 한다 — DB 변경 없음.
export default async function ArchivePage() {
  const user = await requireAlumniAccess();

  let cohorts: ArchiveCohort[] = [];
  let sessions: ArchiveSession[] = [];
  try {
    const sb = await getSupabaseServer();
    const { data: cohortRows } = await sb
      .from("cohorts")
      .select("id, name, edu_start, edu_end, status")
      .order("edu_start", { ascending: false });
    cohorts = (cohortRows as ArchiveCohort[]) ?? [];

    const { data: sessionRows } = await sb
      .from("sessions")
      .select("id, cohort_id, week_no, title, starts_at, type")
      .eq("is_published", true)
      .order("week_no", { ascending: true });
    const sessionList = (sessionRows as ArchiveSession[]) ?? [];

    if (sessionList.length > 0) {
      const ids = sessionList.map((s) => s.id);
      const [{ data: videoRows }, { data: materialRows }] = await Promise.all([
        sb.from("videos").select("id, session_id, title, google_drive_url").in("session_id", ids),
        sb.from("materials").select("id, session_id, title, file_path, version").in("session_id", ids),
      ]);
      const videosBySession = new Map<string, ArchiveSession["videos"]>();
      for (const v of (videoRows as { id: string; session_id: string; title: string | null; google_drive_url: string | null }[]) ?? []) {
        const arr = videosBySession.get(v.session_id) ?? [];
        arr.push(v);
        videosBySession.set(v.session_id, arr);
      }
      const materialsBySession = new Map<string, ArchiveSession["materials"]>();
      for (const m of (materialRows as { id: string; session_id: string; title: string; file_path: string | null; version: number | null }[]) ?? []) {
        const arr = materialsBySession.get(m.session_id) ?? [];
        arr.push(m);
        materialsBySession.set(m.session_id, arr);
      }
      sessions = sessionList.map((s) => ({
        ...s,
        videos: videosBySession.get(s.id) ?? [],
        materials: materialsBySession.get(s.id) ?? [],
      }));
    }
  } catch {
    /* 스키마 미적용 환경 — 빈 배열로 렌더 */
  }

  return <ArchiveView hasActiveMembership={user.hasActiveMembership} cohorts={cohorts} sessions={sessions} />;
}
