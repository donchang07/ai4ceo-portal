"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button, Callout, Card, CardTitle, Input, Textarea } from "@/components/ui";
import { submitInquiry } from "./actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^01[016789]-?\d{3,4}-?\d{4}$/;

export function ContactForm({ source }: { source?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const emailError = email.trim() && !EMAIL_RE.test(email.trim()) ? "이메일 형식이 올바르지 않습니다." : null;
  const phoneError = phone.trim() && !PHONE_RE.test(phone.trim()) ? "휴대폰 번호 형식이 올바르지 않습니다." : null;
  const contactGiven = email.trim().length > 0 || phone.trim().length > 0;
  const canSubmit =
    name.trim().length > 0 && message.trim().length > 0 && contactGiven && !emailError && !phoneError && !busy;

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await submitInquiry({ name, email, phone, message, source }).catch(() => null);
    if (res?.ok) setDone(true);
    else setError(res?.error ?? "문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    setBusy(false);
  }

  if (done) {
    return (
      <Card>
        <div className="flex flex-col items-center py-6 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-info-surface text-success">
            <CheckCircle2 size={28} />
          </span>
          <h2 className="mt-5 text-xl font-bold text-ink">문의가 접수되었습니다</h2>
          <p className="mt-2 text-sm text-muted">담당자가 확인 후 남겨주신 연락처로 회신드립니다.</p>
          <div className="mt-6">
            <Button href="/" variant="secondary">홈으로</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>문의 남기기</CardTitle>
      <p className="mt-1 text-[13px] text-muted">
        이메일 또는 연락처 중 최소 하나는 입력해 주세요. 접수된 문의는 관리자에게 바로 전달됩니다.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-[13px] font-medium text-ink">성함</label>
          <Input className="mt-1.5" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-[13px] font-medium text-ink">이메일</label>
          <Input
            className="mt-1.5"
            type="email"
            placeholder="ceo@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailError && <p className="mt-1.5 text-[13px] text-danger">{emailError}</p>}
        </div>
        <div>
          <label className="text-[13px] font-medium text-ink">연락처</label>
          <Input
            className="mt-1.5"
            type="tel"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {phoneError && <p className="mt-1.5 text-[13px] text-danger">{phoneError}</p>}
        </div>
        <div>
          <label className="text-[13px] font-medium text-ink">문의 내용</label>
          <Textarea
            className="mt-1.5 min-h-36"
            placeholder="궁금하신 내용을 자유롭게 적어주세요."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
      </div>

      {error && <Callout className="mt-4">{error}</Callout>}

      <Button variant="primary" full className="mt-5" disabled={!canSubmit} onClick={submit}>
        {busy ? "접수 중…" : "문의 접수"}
      </Button>
    </Card>
  );
}
