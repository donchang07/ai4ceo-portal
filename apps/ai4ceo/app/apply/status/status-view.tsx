"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { Badge, Button, Card, CardTitle, Input, SectionTitle } from "@/components/ui";
import { cn } from "@/lib/core/cn";

interface StatusRow {
  app_status: string;
  cohort_name: string;
  submitted_at: string;
}

const STATUS_LABEL: Record<string, { label: string; tone: "neutral" | "info" | "progress" | "done" }> = {
  received: { label: "접수 완료", tone: "info" },
  reviewing: { label: "심사 중", tone: "progress" },
  accepted: { label: "합격", tone: "done" },
  rejected: { label: "불합격", tone: "neutral" },
  waitlist: { label: "대기", tone: "neutral" },
};

// received → reviewing → 발표(accepted/rejected/waitlist)
const STEPS = ["접수", "심사", "발표"] as const;

function stepIndex(status: string): number {
  if (status === "received") return 0;
  if (status === "reviewing") return 1;
  return 2;
}

export function ApplyStatusView({ initialEmail, initialPhone, initialRows, submitted, initialValidationError }: {
  initialEmail: string;
  initialPhone: string;
  initialRows: StatusRow[];
  submitted: boolean;
  initialValidationError?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [validationError, setValidationError] = useState(initialValidationError ?? "");
  const rows = initialRows;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const validPhone = phone.replace(/\D/g, "").length >= 10;
    if (validEmail && validPhone) return;
    event.preventDefault();
    setValidationError(
      !validEmail
        ? "올바른 이메일을 입력해 주세요."
        : "전화번호를 숫자 10자리 이상 입력해 주세요.",
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <main className="mx-auto max-w-[560px] px-5 py-10">
        <SectionTitle>지원 상태 조회</SectionTitle>
        <p className="mt-1 text-sm text-muted">
          지원 시 입력한 이메일과 전화번호로 전형 진행 상태를 확인할 수 있습니다.
        </p>

        <Card className="mt-6">
          <form
            method="get"
            action="/apply/status"
            noValidate
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
          >
            <label className="text-sm font-medium text-ink">
              이메일
              <Input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1"
              />
            </label>
            <label className="text-sm font-medium text-ink">
              전화번호
              <Input
                type="tel"
                name="phone"
                required
                pattern="[0-9() +.-]{10,}"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="mt-1"
              />
            </label>
            <Button type="submit" variant="primary" full>
              <Search size={16} /> 상태 조회
            </Button>
            {validationError ? (
              <p role="alert" className="text-sm font-medium text-danger">
                {validationError}
              </p>
            ) : null}
          </form>
        </Card>

        {submitted && rows.length === 0 ? (
          <Card className="mt-4">
            <p className="text-sm text-muted">
              일치하는 지원 내역이 없습니다. 입력 정보를 다시 확인하시거나, 아직 지원 전이라면{" "}
              <Link href="/apply" className="font-semibold text-primary">
                지원서 작성
              </Link>
              으로 이동해 주세요.
            </p>
          </Card>
        ) : null}

        {rows.map((row, i) => {
          const meta = STATUS_LABEL[row.app_status] ?? { label: row.app_status, tone: "neutral" as const };
          const current = stepIndex(row.app_status);
          return (
            <Card key={i} className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{row.cohort_name || "AI4CEO"}</CardTitle>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">
                접수일: {new Date(row.submitted_at).toLocaleDateString("ko-KR")}
              </p>
              <div className="mt-4 flex items-center gap-2">
                {STEPS.map((step, idx) => (
                  <div key={step} className="flex flex-1 items-center gap-2">
                    <span
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                        idx <= current ? "bg-primary text-white" : "bg-surface-muted text-faint",
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span className={cn("text-xs font-medium", idx <= current ? "text-ink" : "text-faint")}>
                      {step}
                    </span>
                    {idx < STEPS.length - 1 ? <span className="h-px flex-1 bg-hairline" /> : null}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </main>
    </div>
  );
}
