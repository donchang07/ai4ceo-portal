"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, RotateCcw } from "lucide-react";
import { Button, Card, CardTitle, Chip } from "@/components/ui";

// Design Ref: prd-v30-final.design.md §2 — SCR-01 자가진단.
// 응답은 저장하지 않는다(비로그인·개인정보 미수집, PRD §7.3 ①).

interface Question {
  q: string;
  options: { label: string; score: number }[];
}

const QUESTIONS: Question[] = [
  {
    q: "코딩 경험이 있으신가요?",
    options: [
      { label: "전혀 없다", score: 2 },
      { label: "맛보기 정도 해봤다", score: 1 },
      { label: "실무 경험이 있다", score: 1 },
    ],
  },
  {
    q: "주당 학습·실습에 쓸 수 있는 시간은?",
    options: [
      { label: "3시간 이상", score: 2 },
      { label: "1~2시간", score: 1 },
      { label: "거의 없다", score: 0 },
    ],
  },
  {
    q: "우리 회사의 AI 도입 상황은?",
    options: [
      { label: "논의만 있고 실행 전", score: 2 },
      { label: "파일럿 후 확산이 멈춤", score: 2 },
      { label: "외주·IT 부서가 진행 중", score: 1 },
    ],
  },
  {
    q: "직접 만들어보고 싶은 업무 도구가 있나요?",
    options: [
      { label: "명확히 있다", score: 2 },
      { label: "막연히 있다", score: 1 },
      { label: "아직 모르겠다", score: 0 },
    ],
  },
  {
    q: "현재 역할은?",
    options: [
      { label: "CEO·임원 (의사결정권자)", score: 2 },
      { label: "팀장·실무 리더", score: 1 },
      { label: "기타", score: 1 },
    ],
  },
];

const RESULTS = [
  {
    min: 8,
    title: "적극 추천 — 지금이 시작할 때입니다",
    body: "코딩 경험이 없어도 괜찮습니다. 이 과정은 정확히 지금의 대표님 같은 분을 위해 설계됐습니다. 4주 안에 첫 결과물을 만들 가능성이 가장 높은 프로필입니다.",
  },
  {
    min: 5,
    title: "추천 — 충분히 따라올 수 있습니다",
    body: "실습 시간을 조금만 확보하시면 무리 없이 완주할 수 있는 프로필입니다. 매주 세션 + 주중 1~2회 복습 리듬을 권합니다.",
  },
  {
    min: 0,
    title: "상담 권장 — 시작 전에 이야기 나눠요",
    body: "지금 상황에 맞는 시작 방법을 먼저 정하는 게 좋겠습니다. 부담 없이 문의 주시면 과정이 맞는지 솔직하게 말씀드립니다.",
  },
];

export function SelfCheck() {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null));

  const answered = answers.filter((a) => a !== null).length;
  const done = answered === QUESTIONS.length;

  const score = useMemo(
    () => answers.reduce<number>((sum, a, i) => sum + (a === null ? 0 : QUESTIONS[i].options[a].score), 0),
    [answers],
  );
  const result = RESULTS.find((r) => score >= r.min) ?? RESULTS[RESULTS.length - 1];

  function pick(qi: number, oi: number) {
    setAnswers((prev) => prev.map((v, i) => (i === qi ? oi : v)));
  }

  function reset() {
    setAnswers(Array(QUESTIONS.length).fill(null));
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink">
          <ClipboardCheck size={18} className="text-primary" />
          <CardTitle>5분 자가진단 — 나에게 맞는 과정일까?</CardTitle>
        </div>
        <span className="tnum text-xs text-muted">{answered}/{QUESTIONS.length}</span>
      </div>
      <p className="mt-1.5 text-[13px] text-muted">
        응답은 저장되지 않습니다. 5개 문항에 답하면 바로 결과를 보여드립니다.
      </p>

      <div className="mt-5 space-y-5">
        {QUESTIONS.map((question, qi) => (
          <div key={question.q}>
            <p className="text-sm font-semibold text-ink">
              {qi + 1}. {question.q}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {question.options.map((opt, oi) => (
                <Chip key={opt.label} active={answers[qi] === oi} onClick={() => pick(qi, oi)}>
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      </div>

      {done ? (
        <div className="mt-6 rounded-[12px] border border-cardline bg-info-surface px-5 py-4">
          <p className="text-sm font-bold text-ink">{result.title}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{result.body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button href="/apply" variant="primary">18기 지원하기</Button>
            <Button href="mailto:donchang0725@gmail.com" variant="secondary">문의하기</Button>
            <Button variant="ghost" onClick={reset}>
              <RotateCcw size={14} /> 다시 하기
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
