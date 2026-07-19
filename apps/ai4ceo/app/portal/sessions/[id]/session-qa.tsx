"use client";

import { useState, useTransition } from "react";
import { MessageCircleQuestion, Send, Sparkles, GraduationCap, User } from "lucide-react";
import { Card, CardTitle, Input, Badge, Button } from "@/components/ui";
import type { QuestionWithAnswers } from "@/lib/db/types";
import { askQuestion, answerQuestion, answerWithAi } from "./actions";

function timeAgo(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function SessionQa({
  sessionId,
  cohortId,
  questions,
  canAnswer,
}: {
  sessionId: string;
  cohortId: string;
  questions: QuestionWithAnswers[];
  canAnswer: boolean; // instructor/admin — 답변 작성 UI 노출
}) {
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitQuestion() {
    const text = q.trim();
    if (!text) return;
    setError(null);
    startTransition(async () => {
      const r = await askQuestion(sessionId, cohortId, text);
      if (!r.ok) setError(r.message);
      else setQ("");
    });
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <MessageCircleQuestion size={18} className="text-primary" />
        <CardTitle>질의응답</CardTitle>
        <Badge tone="neutral">{questions.length}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted">
        강의 내용을 질문하면 강사·동료 수강생이 답하거나, AI 조교에게 즉시 답변을 받을 수 있습니다.
      </p>

      {/* 질문 입력 */}
      <div className="mt-4 flex items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitQuestion();
          }}
          placeholder="이 강의에 대해 질문을 남겨보세요"
        />
        <button
          onClick={submitQuestion}
          disabled={isPending}
          aria-label="질문 등록"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {/* 질문 목록 */}
      <div className="mt-5 space-y-4">
        {questions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">아직 질문이 없습니다. 첫 질문을 남겨보세요.</p>
        ) : (
          questions.map((question) => (
            <QuestionItem key={question.id} sessionId={sessionId} question={question} canAnswer={canAnswer} />
          ))
        )}
      </div>
    </Card>
  );
}

function QuestionItem({
  sessionId,
  question,
  canAnswer,
}: {
  sessionId: string;
  question: QuestionWithAnswers;
  canAnswer: boolean;
}) {
  const [reply, setReply] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitAnswer() {
    const text = reply.trim();
    if (!text) return;
    setError(null);
    startTransition(async () => {
      const r = await answerQuestion(sessionId, question.id, text);
      if (!r.ok) setError(r.message);
      else {
        setReply("");
        setShowReply(false);
      }
    });
  }

  function submitAi() {
    setError(null);
    startTransition(async () => {
      const r = await answerWithAi(sessionId, question.id, question.body);
      if (!r.ok) setError(r.message);
    });
  }

  return (
    <div className="rounded-control border border-hairline bg-surface p-4">
      {/* 질문 */}
      <div className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-semibold text-primary">
          {(question.author_name ?? "?").slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="font-semibold text-ink">{question.author_name ?? "수강생"}</span>
            <span>{timeAgo(question.created_at)}</span>
          </div>
          <p className="mt-1 text-sm text-ink">{question.body}</p>
        </div>
      </div>

      {/* 답변들 */}
      {question.answers.length > 0 && (
        <div className="mt-3 space-y-2.5 border-l-2 border-hairline pl-3">
          {question.answers.map((a) => (
            <div key={a.id} className="flex items-start gap-2">
              <span
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                  a.is_ai ? "bg-info-surface text-info" : a.is_instructor ? "bg-primary text-white" : "bg-surface-muted text-primary"
                }`}
              >
                {a.is_ai ? <Sparkles size={12} /> : a.is_instructor ? <GraduationCap size={12} /> : <User size={12} />}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-muted">
                  <span className="font-semibold text-ink">{a.author_name}</span>
                  {a.is_instructor && <Badge tone="progress" className="px-1.5 py-0">강사</Badge>}
                  {a.is_ai && <Badge tone="info" className="bg-info-surface px-1.5 py-0">AI</Badge>}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink">{a.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 액션 */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowReply((v) => !v)}
          className="text-xs font-semibold text-primary hover:underline"
        >
          답변 달기
        </button>
        <span className="text-faint">·</span>
        <button
          onClick={submitAi}
          disabled={isPending}
          className="inline-flex items-center gap-1 text-xs font-semibold text-info hover:underline disabled:opacity-50"
        >
          <Sparkles size={12} /> AI 조교 답변 받기
        </button>
      </div>

      {showReply && (
        <div className="mt-2 flex items-center gap-2">
          <Input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitAnswer();
            }}
            placeholder={canAnswer ? "강사 답변 입력" : "답변 입력"}
          />
          <Button variant="primary" onClick={submitAnswer} disabled={isPending} className="min-h-9 px-3 text-xs">
            등록
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
