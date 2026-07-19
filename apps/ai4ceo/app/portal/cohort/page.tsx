import Link from "next/link";
import {
  Check,
  Video,
  MessageSquare,
  Sparkles,
  PlayCircle,
  CalendarClock,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Button, Card, CardTitle, SectionTitle } from "@/components/ui";
import { getSessions, getAssignments } from "@/lib/db/queries";
import { MOCK_BUILD_STEPS, MOCK_CHAT } from "@/lib/db/mock";
import { cn } from "@/lib/core/cn";

function dDay(iso: string): string {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (diff === 0) return "D-DAY";
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const w = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${w}) ${hh}:${mm}`;
}

export default async function CohortHome() {
  const [sessions, assignments] = await Promise.all([getSessions(), getAssignments()]);
  const nextSession =
    sessions.find((s) => s.type === "regular_zoom" && new Date(s.starts_at).getTime() >= Date.now()) ??
    sessions.find((s) => s.type === "regular_zoom") ??
    sessions[0];
  const nextAssignment = [...assignments].sort(
    (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime(),
  )[0];
  const recentChat = MOCK_CHAT.filter((m) => m.message_type !== "notice").slice(-2);

  return (
    <PortalShell title="Cohort Home">
      <div className="mb-6">
        <SectionTitle>안녕하세요, 대표님</SectionTitle>
        <p className="mt-1 text-sm text-muted">
          오늘 할 일: 진행 중인 초안을 이어서 만들고, 다음 세션 준비물을 확인하세요.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* My Build */}
          <Card>
            <CardTitle>My Build</CardTitle>
            <p className="mt-1 text-sm text-muted">우리 회사 문제 하나를 5단계로 완성합니다.</p>

            <ol className="mt-5 flex items-start justify-between">
              {MOCK_BUILD_STEPS.map((step, i) => (
                <li key={step.key} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <span className={cn("h-px flex-1", i === 0 ? "bg-transparent" : "bg-cardline")} />
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold",
                        step.state === "done" && "bg-primary text-white",
                        step.state === "current" && "border-2 border-primary text-primary",
                        step.state === "future" && "border border-cardline text-faint",
                      )}
                    >
                      {step.state === "done" ? <Check size={16} /> : i + 1}
                    </span>
                    <span
                      className={cn("h-px flex-1", i === MOCK_BUILD_STEPS.length - 1 ? "bg-transparent" : "bg-cardline")}
                    />
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs",
                      step.state === "current" ? "font-semibold text-ink" : "text-muted",
                    )}
                  >
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-5 rounded-control border border-cardline bg-surface-muted px-4 py-3 text-[13px] text-muted">
              코칭 메모 — 문제 정의와 레퍼런스가 좋습니다. 이제 초안을 만들어 다음 코칭에서 함께 다듬어요.
            </div>

            <div className="mt-4">
              <Button variant="primary">
                <ArrowRight size={16} /> 초안 이어서 만들기
              </Button>
            </div>
          </Card>

          {/* This Week */}
          <Card>
            <CardTitle>This Week</CardTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {/* Next session */}
              {nextSession ? (
                <div className="rounded-control border border-cardline bg-surface p-4">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <CalendarClock size={15} /> {nextSession.week_no}주차 · {dDay(nextSession.starts_at)}
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-sm font-semibold text-ink">{nextSession.title}</div>
                  <div className="mt-1 text-xs text-muted">{fmtDateTime(nextSession.starts_at)}</div>
                  <div className="mt-3">
                    <Button
                      variant="secondary"
                      href={nextSession.zoom_url ?? `/portal/sessions/${nextSession.id}`}
                    >
                      <Video size={16} /> Zoom 입장
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Assignment due */}
              {nextAssignment ? (
                <div className="rounded-control border border-cardline bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-muted">
                      <ClipboardList size={15} /> 과제 마감
                    </span>
                    <Badge tone="danger">{dDay(nextAssignment.due_at)}</Badge>
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-sm font-semibold text-ink">{nextAssignment.title}</div>
                  <div className="mt-1 line-clamp-1 text-xs text-muted">{nextAssignment.description}</div>
                  <div className="mt-3">
                    <Button variant="outline" href="/portal/assignments">
                      제출하러 가기
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Chat preview */}
          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>18기 대화방</CardTitle>
              <MessageSquare size={18} className="text-faint" />
            </div>
            <ul className="mt-3 space-y-2.5">
              {recentChat.map((m) => (
                <li key={m.id} className="text-[13px]">
                  <span className="font-semibold text-ink">{m.author}</span>{" "}
                  <span className="line-clamp-1 text-muted">
                    {m.message_type === "file" ? m.fileMeta?.name : m.body}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Button variant="secondary" href="/portal/chat" full>
                대화방 열기
              </Button>
            </div>
          </Card>

          {/* New lecture video */}
          <Card>
            <CardTitle>새 강의 영상</CardTitle>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-[58px] w-24 shrink-0 place-items-center rounded bg-dark text-white/80">
                <PlayCircle size={22} />
              </div>
              <div className="min-w-0">
                <div className="line-clamp-2 text-[13px] font-medium text-ink">
                  {nextSession?.title ?? "이번 주 강의"}
                </div>
                <div className="mt-1.5">
                  <Badge tone="neutral">Drive · 읽기 전용</Badge>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="secondary" href={`/portal/sessions/${nextSession?.id ?? "s1"}`} full>
                영상 보기
              </Button>
            </div>
          </Card>

          {/* AI tutor entry */}
          <Card className="bg-info-surface">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white">
                <Sparkles size={18} />
              </span>
              <div>
                <CardTitle>AI 조교</CardTitle>
                <p className="text-xs text-muted">커리큘럼·자료·영상 기준으로 답해드려요.</p>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="primary" href="/portal/ai" full>
                AI 조교에게 질문하기
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PortalShell>
  );
}
