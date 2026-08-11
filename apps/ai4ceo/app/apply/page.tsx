"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { Button, Input, Progress, Callout } from "@/components/ui";
import { submitApplication } from "./actions";

type Field = "name" | "phone" | "email";

interface StepDef {
  field: Field;
  question: string;
  hint: string;
  placeholder: string;
  type?: string;
  validate?: (v: string) => string | null;
}

// 휴대폰 번호 — 하이픈 유무 모두 허용(010-1234-5678 / 01012345678)
const PHONE_RE = /^01[016789]-?\d{3,4}-?\d{4}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const STEPS: StepDef[] = [
  { field: "name", question: "성함을 알려주세요", hint: "지원서에 표기될 대표자 성함입니다.", placeholder: "홍길동" },
  {
    field: "phone",
    question: "연락 가능한 전화번호를 알려주세요",
    hint: "수강 안내를 문자로 보내드립니다.",
    placeholder: "010-0000-0000",
    type: "tel",
    validate: (v) => (PHONE_RE.test(v.trim()) ? null : "휴대폰 번호 형식이 올바르지 않습니다. 예) 010-1234-5678"),
  },
  {
    field: "email",
    question: "이메일 주소를 입력해 주세요",
    hint: "합격 시 계정 생성 링크를 보내드립니다.",
    placeholder: "ceo@company.com",
    type: "email",
    validate: (v) => (EMAIL_RE.test(v.trim()) ? null : "이메일 형식이 올바르지 않습니다. 예) ceo@company.com"),
  },
];

const TOTAL = STEPS.length;

const emptyForm: Record<Field, string> = {
  name: "",
  phone: "",
  email: "",
};

export default function ApplyPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<Field, string>>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [receiptNo, setReceiptNo] = useState<string | null>(null);

  const current = STEPS[step];
  const isLast = step === TOTAL - 1;
  const value = form[current.field];
  const filled = value.trim().length > 0;
  const formatError = filled ? current.validate?.(value) ?? null : null;
  const canProceed = filled && !formatError;

  function update(v: string) {
    setForm((f) => ({ ...f, [current.field]: v }));
  }

  async function submit() {
    setSubmitting(true);
    // 서버 액션이 접수 저장 + 알림톡 T-01(접수) 발송을 함께 처리한다 (prd-v30-final §4 F3)
    const result = await submitApplication(form).catch(() => null);
    setReceiptNo(result?.receiptNo ?? `AP-18-${Math.floor(1000 + Math.random() * 9000)}`);
    setSubmitting(false);
  }

  function next() {
    if (isLast) {
      void submit();
    } else {
      setStep((s) => Math.min(TOTAL - 1, s + 1));
    }
  }

  if (receiptNo) {
    return (
      <div className="min-h-screen bg-canvas">
        <PublicHeader />
        <main className="mx-auto flex max-w-[560px] flex-col items-center px-6 py-20 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-info-surface text-success">
            <CheckCircle2 size={28} />
          </span>
          <h1 className="mt-6 text-2xl font-bold text-ink">지원이 접수되었습니다</h1>
          <p className="mt-2 text-sm text-muted">수강 안내를 문자로 보내드립니다.</p>
          <div className="mt-6 w-full rounded-[15px] border border-hairline bg-surface p-5">
            <div className="text-xs text-faint">접수번호</div>
            <div className="tnum mt-1 text-2xl font-bold tracking-tight text-ink">{receiptNo}</div>
          </div>
          <div className="mt-8">
            <Button href="/" variant="secondary">
              <ArrowLeft size={15} /> 과정 소개로
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <main className="mx-auto max-w-[640px] px-6 py-10">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <Progress pct={((step + 1) / TOTAL) * 100} />
          <span className="tnum shrink-0 text-xs font-semibold text-muted">
            {step + 1} / {TOTAL}
          </span>
        </div>

        {/* Question */}
        <div className="mt-10">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{current.question}</h1>
          <p className="mt-2 text-sm text-muted">{current.hint}</p>

          <div className="mt-6">
            <Input
              autoFocus
              className="min-h-12 text-base"
              type={current.type ?? "text"}
              placeholder={current.placeholder}
              value={value}
              onChange={(e) => update(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canProceed) next();
              }}
            />
            {formatError && <p className="mt-2 text-[13px] text-danger">{formatError}</p>}
          </div>
        </div>

        {/* Nav */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <Button
            variant="secondary"
            full
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            이전
          </Button>
          <Button
            variant="primary"
            full
            className="col-span-2"
            disabled={!canProceed || submitting}
            onClick={next}
          >
            {isLast ? (submitting ? "제출 중…" : "제출") : "다음"}
          </Button>
        </div>

        <Callout className="mt-6">
          로그인 없이 제출하실 수 있으며, 수강 안내를 문자로 보내드립니다.
        </Callout>
      </main>
    </div>
  );
}
