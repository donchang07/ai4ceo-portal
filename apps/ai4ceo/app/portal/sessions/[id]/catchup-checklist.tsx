"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import { Badge, Card, CardTitle, Progress } from "@/components/ui";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";
import { cn } from "@/lib/core/cn";

// Design Ref: prd-v30-remaining.design.md §4 F4 — SCR-07 결석 따라잡기 (US-08).
// 출석 데이터 부재로 지난 세션 전체에 노출(Plan D-3). session_catchups upsert 저장.

export interface CatchupState {
  watched: boolean;
  materials_done: boolean;
  assignment_done: boolean;
  asked_ai: boolean;
  completed_at: string | null;
}

type StepKey = "watched" | "materials_done" | "assignment_done" | "asked_ai";

const STEPS: { key: StepKey; label: string; hint: string; href: string | null }[] = [
  { key: "watched", label: "녹화 영상 시청", hint: "이 페이지 상단의 영상을 끝까지 확인", href: null },
  { key: "materials_done", label: "강의자료 확인", hint: "자료를 내려받아 실습 환경에서 열기", href: null },
  { key: "assignment_done", label: "과제 제출", hint: "이 주차 과제를 제출", href: "/portal/assignments" },
  { key: "asked_ai", label: "막힌 곳 AI 조교에 질문", hint: "안 풀리는 부분은 넘어가지 말고 바로 질문", href: "/portal/ai" },
];

export function CatchupChecklist({
  userId,
  sessionId,
  initial,
}: {
  userId: string;
  sessionId: string;
  initial: CatchupState | null;
}) {
  const [state, setState] = useState<CatchupState>(
    initial ?? { watched: false, materials_done: false, assignment_done: false, asked_ai: false, completed_at: null },
  );
  const [error, setError] = useState<string | null>(null);

  const doneCount = STEPS.filter((s) => state[s.key]).length;
  const allDone = doneCount === STEPS.length;

  async function toggle(key: StepKey) {
    const next: CatchupState = { ...state, [key]: !state[key] };
    const nextAll = STEPS.every((s) => next[s.key]);
    next.completed_at = nextAll ? (state.completed_at ?? new Date().toISOString()) : null;
    setState(next);
    setError(null);
    try {
      const sb = getSupabaseBrowser();
      const { error: err } = await sb.from("session_catchups").upsert(
        {
          user_id: userId,
          session_id: sessionId,
          watched: next.watched,
          materials_done: next.materials_done,
          assignment_done: next.assignment_done,
          asked_ai: next.asked_ai,
          completed_at: next.completed_at,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,session_id" },
      );
      if (err) throw err;
    } catch {
      setState(state); // 롤백
      setError("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <Card className="mt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks size={16} className="text-primary" />
          <CardTitle>따라잡기 체크리스트</CardTitle>
        </div>
        {allDone ? (
          <Badge tone="done">따라잡기 완료</Badge>
        ) : (
          <span className="tnum text-xs text-muted">{doneCount}/{STEPS.length}</span>
        )}
      </div>
      <p className="mt-1.5 text-[13px] text-muted">
        세션을 놓쳤어도 이 4단계만 마치면 흐름을 따라잡을 수 있습니다. 체크 상태는 자동
        저장됩니다.
      </p>
      <Progress pct={(doneCount / STEPS.length) * 100} className="mt-3" />

      <ul className="mt-4 space-y-1">
        {STEPS.map((step, i) => {
          const checked = state[step.key];
          return (
            <li key={step.key}>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-[12px] px-3 py-2.5",
                  checked ? "bg-info-surface/60" : "hover:bg-surface-muted",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(step.key)}
                  className="mt-0.5 shrink-0 text-primary"
                  aria-label={`${step.label} ${checked ? "완료 취소" : "완료"}`}
                >
                  {checked ? <CheckCircle2 size={19} /> : <Circle size={19} className="text-faint" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", checked ? "text-muted line-through" : "text-ink")}>
                    {i + 1}. {step.label}
                  </p>
                  <p className="text-xs text-muted">{step.hint}</p>
                </div>
                {step.href ? (
                  <Link href={step.href} className="shrink-0 text-xs font-semibold text-primary hover:underline">
                    바로가기
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </Card>
  );
}
