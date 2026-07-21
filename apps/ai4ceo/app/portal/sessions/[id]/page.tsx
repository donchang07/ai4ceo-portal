import Link from "next/link";
import { FileText, Download, ClipboardList, ChevronRight } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Button, Card, CardTitle } from "@/components/ui";
import {
  getSession,
  getMaterials,
  getAssignments,
  getSessionVideo,
  getSessionQuestions,
} from "@/lib/db/queries";
import { requireArchiveAccess } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { isAdmin } from "@/lib/core/access";
import { SessionInteractive } from "./session-interactive";
import { SessionQa } from "./session-qa";
import { CatchupChecklist, type CatchupState } from "./catchup-checklist";

// Design Ref: prd-v30-remaining.design.md §4 F4 — SCR-07 따라잡기 진행 상태
async function getCatchup(userId: string, sessionId: string): Promise<CatchupState | null> {
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb
      .from("session_catchups")
      .select("watched, materials_done, assignment_done, asked_ai, completed_at")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .maybeSingle();
    return (data as CatchupState) ?? null;
  } catch {
    return null;
  }
}

function fmtRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const w = ["일", "월", "화", "수", "목", "금", "토"][s.getDay()];
  const t = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${s.getFullYear()}년 ${s.getMonth() + 1}월 ${s.getDate()}일(${w}) ${t(s)}–${t(e)}`;
}

export default async function SessionDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireArchiveAccess();
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return (
      <PortalShell title="세션">
        <p className="text-sm text-muted">세션을 찾을 수 없습니다.</p>
      </PortalShell>
    );
  }
  const [materials, assignments, video, questions, catchup] = await Promise.all([
    getMaterials(session.id),
    getAssignments(),
    getSessionVideo(session.id),
    getSessionQuestions(session.id),
    getCatchup(user.id, session.id),
  ]);
  const linkedAssignment = assignments[0];
  const isPast = new Date(session.starts_at).getTime() < Date.now();

  return (
    <PortalShell title="세션 상세">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-xs text-muted">
        <Link href="/portal/sessions" className="hover:text-ink">
          세션
        </Link>
        <ChevronRight size={13} />
        <span className="text-ink">{session.week_no > 0 ? `${session.week_no}주차` : "보충"}</span>
      </nav>

      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="wait">출석 예정</Badge>
          <span className="text-xs text-muted">{fmtRange(session.starts_at, session.ends_at)}</span>
        </div>
        <h1 className="mt-2 text-[22px] font-bold tracking-tight text-ink">
          {session.week_no > 0 ? `${session.week_no}주차 · ` : ""}
          {session.title}
        </h1>
        {session.description ? <p className="mt-1.5 text-sm text-muted">{session.description}</p> : null}
      </div>

      {/* 영상 + AI 조교 */}
      <SessionInteractive videoUrl={video?.google_drive_url ?? null} />

      {/* 따라잡기 체크리스트 (SCR-07) — 지난 세션에만 노출 */}
      {isPast ? <CatchupChecklist userId={user.id} sessionId={session.id} initial={catchup} /> : null}

      {/* 강의자료 + 연결 과제 */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardTitle>강의자료</CardTitle>
          {materials.length === 0 ? (
            <p className="mt-3 text-sm text-muted">등록된 강의자료가 없습니다.</p>
          ) : (
            <ul className="mt-3 divide-y divide-hairline">
              {materials.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <FileText size={18} className="shrink-0 text-info" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{m.title}</div>
                  </div>
                  {m.version ? <span className="text-xs text-muted tnum">v{m.version}</span> : null}
                  <a
                    href={m.file_path || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid h-9 w-9 place-items-center rounded-control border border-cardline text-ink hover:bg-surface-muted"
                    aria-label="열기"
                  >
                    <Download size={16} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {linkedAssignment ? (
          <Card>
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-muted" />
              <CardTitle>연결된 과제</CardTitle>
            </div>
            <div className="mt-3 text-sm font-semibold text-ink">{linkedAssignment.title}</div>
            <p className="mt-1 text-xs text-muted">{linkedAssignment.description}</p>
            <div className="mt-4">
              <Button variant="outline" href="/portal/assignments" full>
                과제 확인하기
              </Button>
            </div>
          </Card>
        ) : null}
      </div>

      {/* 질의응답 */}
      <div className="mt-5">
        <SessionQa
          sessionId={session.id}
          cohortId={session.cohort_id}
          questions={questions}
          canAnswer={isAdmin(user.role) || user.role === "assistant"}
        />
      </div>
    </PortalShell>
  );
}
