import { AppShell } from "@/components/app-shell";
import { Badge, Button } from "@/components/ui";
import { Timer, FileCheck, CircleDashed, CalendarDays } from "lucide-react";

type Status = "done" | "due" | "todo" | "review";

const statusMap: Record<
  Status,
  { tone: "done" | "due" | "warn" | "review"; label: string }
> = {
  done: { tone: "done", label: "제출 완료" },
  due: { tone: "due", label: "마감 임박" },
  todo: { tone: "warn", label: "미제출" },
  review: { tone: "review", label: "강사 검수 중" },
};

const assignments: {
  title: string;
  session: string;
  due: string;
  status: Status;
}[] = [
  { title: "회사 보고서 자동화 결과물 제출", session: "5주차", due: "6월 16일 (월) 23:59", status: "due" },
  { title: "데이터 연결 실습 스크린샷", session: "4주차", due: "6월 9일 마감", status: "todo" },
  { title: "프롬프트 템플릿 3종 작성", session: "4주차", due: "6월 9일 마감", status: "review" },
  { title: "Claude Code 설치 및 첫 실행", session: "3주차", due: "6월 2일 마감", status: "done" },
];

export default function AssignmentsPage() {
  const submitted = assignments.filter((a) => a.status !== "todo").length;

  return (
    <AppShell>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold">과제</h1>
          <p className="text-sm text-muted">
            제출 현황과 마감을 한 화면에서 관리합니다.
          </p>
        </div>
        <span className="rounded-control border bg-surface px-3 py-1.5 text-sm text-muted">
          제출 <span className="font-semibold text-ink">{submitted}</span> /{" "}
          {assignments.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {assignments.map((a, i) => {
          const s = statusMap[a.status];
          return (
            <div key={i} className="rounded-card border bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="rounded-control bg-surface-muted px-2 py-0.5 text-xs font-semibold text-muted">
                      {a.session}
                    </span>
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </div>
                  <div className="text-base font-semibold">{a.title}</div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted">
                    <CalendarDays size={15} /> {a.due}
                  </div>
                </div>
                <div className="shrink-0">
                  {a.status === "done" ? (
                    <Button variant="secondary">
                      <FileCheck size={16} /> 제출물 보기
                    </Button>
                  ) : a.status === "review" ? (
                    <Button variant="secondary">
                      <CircleDashed size={16} /> 검수 대기
                    </Button>
                  ) : (
                    <Button variant="softcta">
                      <Timer size={16} /> 과제 제출하기
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
