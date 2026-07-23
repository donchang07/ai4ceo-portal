"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, PlayCircle, FileText, Upload, Sparkles, Medal } from "lucide-react";
import { Card, CardTitle } from "@/components/ui";
import { cn } from "@/lib/core/cn";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";

type CatchupKey = "watched" | "materials_done" | "assignment_done" | "asked_ai";

interface CatchupState {
  watched: boolean;
  materials_done: boolean;
  assignment_done: boolean;
  asked_ai: boolean;
  completed_at: string | null;
}

const ITEMS: { key: CatchupKey; label: string; link?: string }[] = [
  { key: "watched", label: "녹화 영상 시청" },
  { key: "materials_done", label: "강의자료 확인" },
  { key: "assignment_done", label: "과제 제출" },
  { key: "asked_ai", label: "막힌 곳 AI 조교로 해소", link: "/portal/ai" },
];

const ICONS: Record<CatchupKey, typeof PlayCircle> = {
  watched: PlayCircle,
  materials_done: FileText,
  assignment_done: Upload,
  asked_ai: Sparkles,
};

const EMPTY: CatchupState = {
  watched: false,
  materials_done: false,
  assignment_done: false,
  asked_ai: false,
  completed_at: null,
};

export function SessionCatchup({ userId, sessionId }: { userId: string; sessionId: string }) {
  const [state, setState] = useState<CatchupState>(EMPTY);
  const [, setRowId] = useState<string | null>(null);
  const [, setLoaded] = useState(false);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  const load = useCallback(async () => {
    try {
      const sb = getSupabaseBrowser();
      const { data } = await sb
        .from("session_catchups")
        .select("id, watched, materials_done, assignment_done, asked_ai, completed_at")
        .eq("user_id", userId)
        .eq("session_id", sessionId)
        .maybeSingle();
      if (data) {
        setRowId(data.id as string);
        setState({
          watched: !!data.watched,
          materials_done: !!data.materials_done,
          assignment_done: !!data.assignment_done,
          asked_ai: !!data.asked_ai,
          completed_at: (data.completed_at as string | null) ?? null,
        });
      }
    } catch {
      // 스키마 미적용 대비 — 빈 상태 유지
    } finally {
      setLoaded(true);
    }
  }, [userId, sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(key: CatchupKey) {
    const next: CatchupState = { ...state, [key]: !state[key] };
    const allDone = next.watched && next.materials_done && next.assignment_done && next.asked_ai;
    next.completed_at = allDone ? state.completed_at ?? new Date().toISOString() : null;
    setState(next);
    saveQueue.current = saveQueue.current.catch(() => undefined).then(async () => {
      const sb = getSupabaseBrowser();
      const payload = {
        user_id: userId,
        session_id: sessionId,
        watched: next.watched,
        materials_done: next.materials_done,
        assignment_done: next.assignment_done,
        asked_ai: next.asked_ai,
        completed_at: next.completed_at,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await sb
        .from("session_catchups")
        .upsert(payload, { onConflict: "user_id,session_id" })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (data) setRowId(data.id as string);
    }).catch(() => {
      // 저장 실패 시 다음 토글에서 재시도 — 낙관적 UI 유지
    });
    await saveQueue.current;
  }

  const doneCount = [state.watched, state.materials_done, state.assignment_done, state.asked_ai].filter(Boolean).length;
  const allDone = doneCount === 4;

  return (
    <Card className="mt-5 bg-surface">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>결석했다면 — 따라잡기</CardTitle>
          <p className="mt-1 text-xs text-muted">한 번의 결석이 완주 실패로 이어지지 않도록, 아래 4단계로 이번 주차를 보완합니다.</p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-primary tnum">{doneCount} / 4</span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {ITEMS.map((item) => {
          const on = state[item.key];
          const Icon = ICONS[item.key];
          return (
            <div
              key={item.key}
              className={cn(
                "flex items-center gap-3 rounded-[11px] border px-3 py-3 transition-colors",
                on ? "border-hairline bg-canvas" : "border-cardline bg-surface",
              )}
            >
              <button
                type="button"
                onClick={() => toggle(item.key)}
                aria-label={on ? "완료 취소" : "완료 표시"}
                aria-pressed={on}
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors",
                  on ? "border-primary bg-primary text-white" : "border-cardline text-transparent hover:border-primary",
                )}
              >
                <Check size={14} />
              </button>
              <Icon size={16} className={cn("shrink-0", on ? "text-faint" : "text-muted")} />
              <span className={cn("flex-1 text-sm", on ? "text-muted line-through" : "font-medium text-ink")}>{item.label}</span>
              {item.link ? (
                <Link href={item.link} className="text-xs font-medium text-primary hover:underline">
                  바로가기
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>

      {allDone ? (
        <div className="mt-4 flex items-center gap-3 rounded-[11px] bg-dark px-4 py-3.5 text-white">
          <Medal size={18} className="shrink-0" />
          <div>
            <p className="text-sm font-semibold">출석 보완 완료</p>
            <p className="text-xs text-white/70">이번 주차를 모두 따라잡았습니다. 출석이 보완완료로 기록됩니다.</p>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
