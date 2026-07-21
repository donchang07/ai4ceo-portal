import { requireArchiveAccess } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { ArchiveView, type ArchiveCohort, type ArchiveSession } from "./archive-view";

// Design Ref: prd-v30-remaining.design.md §4 F6 — SCR-09 동문 아카이브 (US-10).
// 게이트: requireArchiveAccess — 재학생 또는 멤버십 active 동문만.
// 멤버십 만료 동문은 auth 헬퍼가 /alumni/membership으로 보낸다.
export default async function AlumniArchivePage() {
  await requireArchiveAccess();

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
    /* 스키마 미적용 환경 — 빈 아카이브로 렌더 */
  }

  return <ArchiveView cohorts={cohorts} sessions={sessions} />;
}
