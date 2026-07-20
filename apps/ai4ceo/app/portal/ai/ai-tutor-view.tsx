"use client";

import { useState } from "react";
import { Sparkles, Send, Share2, CalendarPlus, Flag, LifeBuoy } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Callout, Chip, Input } from "@/components/ui";
import { RECOMMENDED_QUESTIONS } from "@/lib/db/mock";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";

interface Turn {
  role: "user" | "assistant";
  body: string;
  sources?: string[];
  streaming?: boolean;
  escalated?: boolean;
}

function parseSources(text: string): { body: string; sources?: string[] } {
  const idx = text.lastIndexOf("출처:");
  if (idx === -1) return { body: text };
  const body = text.slice(0, idx).trim();
  const rest = text.slice(idx + 3).trim();
  const sources = rest
    .split(/[,·|\n]/)
    .map((s) => s.replace(/[[\]]/g, "").trim())
    .filter(Boolean);
  return { body, sources: sources.length ? sources : undefined };
}

export function AiTutorView() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);

    const history = [...turns, { role: "user" as const, body: q }];
    setTurns([...history, { role: "assistant", body: "", streaming: true }]);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((t) => ({ role: t.role, content: t.body })),
        }),
      });
      const reader = res.body?.getReader();
      if (!reader) throw new Error("no stream");
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const { body } = parseSources(acc);
        setTurns((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", body: body || acc, streaming: true };
          return next;
        });
      }
      const { body, sources } = parseSources(acc);
      setTurns((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", body, sources, streaming: false };
        return next;
      });
    } catch {
      setTurns((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          body: "답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          streaming: false,
        };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  // Design Ref: §5.4 — US-05 막힘 에스컬레이션. escalated 로그를 신규 insert(스키마 무변경)
  async function escalate(index: number) {
    const answerTurn = turns[index];
    const questionTurn = turns[index - 1];
    if (!answerTurn || answerTurn.escalated) return;
    try {
      const sb = getSupabaseBrowser();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return;
      const { error } = await sb.from("ai_question_logs").insert({
        user_id: user.id,
        question: questionTurn?.role === "user" ? questionTurn.body : "(질문 미확인)",
        answer: answerTurn.body.slice(0, 2000),
        topic: "escalation",
        status: "escalated",
      });
      if (error) throw error;
      setTurns((prev) => prev.map((t, i) => (i === index ? { ...t, escalated: true } : t)));
    } catch {
      // 전달 실패는 조용히 무시하지 않고 사용자에게 재시도 여지를 남긴다 (버튼 유지)
    }
  }

  return (
    <PortalShell title="AI 조교">
      <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-[760px] flex-col md:h-[calc(100vh-7rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white">
            <Sparkles size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-ink">AI 조교</h1>
            <p className="text-xs text-muted">18기 커리큘럼·자료·영상 최신 반영</p>
          </div>
          <Badge tone="done">최신</Badge>
        </div>

        {/* Conversation */}
        <div className="flex-1 space-y-4 overflow-y-auto rounded-[15px] border border-hairline bg-surface p-4">
          {turns.length === 0 ? (
            <div className="flex flex-col gap-3 py-6 text-center">
              <p className="text-sm text-muted">무엇이든 물어보세요. 아래 추천 질문으로 시작할 수 있어요.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {RECOMMENDED_QUESTIONS.map((q) => (
                  <Chip key={q} onClick={() => ask(q)}>
                    {q}
                  </Chip>
                ))}
              </div>
            </div>
          ) : (
            turns.map((t, i) =>
              t.role === "user" ? (
                <div key={i} className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-sm text-white">
                  {t.body}
                </div>
              ) : (
                <div key={i} className="flex gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-info-surface text-info">
                    <Sparkles size={16} />
                  </span>
                  <div className="max-w-[85%]">
                    <div className="whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-info-surface px-3.5 py-2.5 text-sm text-ink">
                      {t.body || <span className="text-faint">답변을 작성 중입니다…</span>}
                    </div>

                    {!t.streaming ? (
                      <>
                        <hr className="my-2.5 border-hairline" />
                        {t.sources && t.sources.length > 0 ? (
                          <div>
                            <span className="text-[11px] font-semibold text-muted">출처</span>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {t.sources.map((s) => (
                                <span
                                  key={s}
                                  className="rounded-full border border-cardline bg-surface px-2 py-0.5 text-[11px] text-muted"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        <p className="mt-2 text-[11px] text-faint">
                          현재 업로드된 자료 기준 답변으로, 정확한 내용은 강사 확인이 필요할 수 있습니다.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Chip>
                            <Share2 size={13} /> 대화방에 공유
                          </Chip>
                          <Chip>
                            <CalendarPlus size={13} /> 코칭 예약
                          </Chip>
                          <Chip>
                            <Flag size={13} /> 신고
                          </Chip>
                          {!t.escalated ? (
                            <Chip onClick={() => escalate(i)}>
                              <LifeBuoy size={13} /> 이 답변으로 해결되지 않았어요
                            </Chip>
                          ) : null}
                        </div>
                        {t.escalated ? (
                          <Callout className="mt-2">
                            <LifeBuoy size={15} className="mt-0.5 shrink-0" />
                            <span>
                              교수 검수 큐에 전달되었습니다. 다음 세션에서 우선 다루며, 급하면 코칭 예약이나 오프라인
                              보충 세션을 이용해 주세요.
                            </span>
                          </Callout>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              ),
            )
          )}
        </div>

        {/* Composer */}
        <div className="mt-3 flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") ask(input);
            }}
            placeholder="무엇이든 물어보세요"
          />
          <button
            onClick={() => ask(input)}
            disabled={busy}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white disabled:opacity-50"
            aria-label="질문"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </PortalShell>
  );
}
