"use client";

import { useState } from "react";
import { Check, Copy, Landmark, Store, FileText, UserPlus, X } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Button, Card, CardTitle, Input } from "@/components/ui";
import { TUITION_KRW, formatKRW, BANK_ACCOUNT } from "@/lib/core/constants";
import { cn } from "@/lib/core/cn";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";

const TIMELINE = [
  { key: "issued", label: "발행 완료", state: "done" as const },
  { key: "waiting", label: "입금 확인 대기", state: "current" as const },
  { key: "confirmed", label: "등록 확정", state: "future" as const },
];

interface BillingViewProps {
  enrollmentId?: string | null;
  initialDelegateEmail?: string | null;
  invoice?: { number: string | null; amount: number | null; status: string | null } | null;
}

export function BillingView({ enrollmentId, initialDelegateEmail, invoice }: BillingViewProps = {}) {
  const [copied, setCopied] = useState(false);

  // Design Ref: §4 F2 — 결제 실무 위임 (enrollments.billing_delegate_email)
  const [delegateEmail, setDelegateEmail] = useState(initialDelegateEmail ?? null);
  const [emailInput, setEmailInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [delegateError, setDelegateError] = useState<string | null>(null);

  async function saveDelegate(email: string | null) {
    if (!enrollmentId) {
      setDelegateError("등록 정보를 찾을 수 없어 위임을 저장할 수 없습니다.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setDelegateError("올바른 이메일 형식이 아닙니다.");
      return;
    }
    setSaving(true);
    setDelegateError(null);
    try {
      const sb = getSupabaseBrowser();
      // enrollments 직접 UPDATE는 RLS상 admin 전용 — 전용 rpc로 위임 컬럼만 갱신
      const { error } = await sb.rpc("set_billing_delegate", {
        p_enrollment_id: enrollmentId,
        p_email: email,
      });
      if (error) throw error;
      setDelegateEmail(email);
      setEmailInput("");
    } catch {
      setDelegateError("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(BANK_ACCOUNT.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <PortalShell title="내 결제">
      <div className="mx-auto flex max-w-[560px] flex-col gap-5">
        {/* Amount card */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted">수강료 (VAT 포함)</p>
              <p className="mt-1 text-3xl font-bold text-ink tnum">{formatKRW(invoice?.amount ?? TUITION_KRW)}</p>
              <p className="mt-1 text-xs text-muted tnum">{invoice?.number ?? "INV-18-0002"}</p>
            </div>
            <Badge tone={invoice?.status === "paid" ? "done" : "wait"}>
              {invoice?.status === "paid" ? "입금 완료" : "입금 대기"}
            </Badge>
          </div>

          {/* Vertical status timeline */}
          <ol className="mt-6 space-y-0">
            {TIMELINE.map((step, i) => (
              <li key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                      step.state === "done" && "bg-primary text-white",
                      step.state === "current" && "border-2 border-primary text-primary",
                      step.state === "future" && "border border-cardline text-faint",
                    )}
                  >
                    {step.state === "done" ? <Check size={14} /> : i + 1}
                  </span>
                  {i < TIMELINE.length - 1 ? (
                    <span className={cn("w-px flex-1", step.state === "done" ? "bg-primary" : "bg-cardline")} />
                  ) : null}
                </div>
                <div className={cn("pb-5", i === TIMELINE.length - 1 && "pb-0")}>
                  <p
                    className={cn(
                      "text-sm",
                      step.state === "future" ? "text-muted" : "font-medium text-ink",
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        {/* Payment methods */}
        <div className="flex flex-col gap-3">
          <CardTitle>결제 방법</CardTitle>

          {/* Bank transfer (recommended) */}
          <Card className="border-primary">
            <div className="flex items-center gap-2">
              <Landmark size={18} className="text-primary" />
              <span className="text-sm font-semibold text-ink">계좌이체</span>
              <Badge tone="progress">권장</Badge>
            </div>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">은행</dt>
                <dd className="font-medium text-ink">{BANK_ACCOUNT.bank}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">계좌번호</dt>
                <dd className="font-medium text-ink tnum">{BANK_ACCOUNT.number}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">예금주</dt>
                <dd className="font-medium text-ink">{BANK_ACCOUNT.holder}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <Button variant="outline" onClick={copyAccount} full>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "복사됨" : "계좌 복사"}
              </Button>
            </div>
          </Card>

          {/* Smartstore */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-muted" />
                <span className="text-sm font-medium text-ink">스마트스토어 결제</span>
              </div>
              <Button variant="secondary">이동</Button>
            </div>
          </Card>
        </div>

        {/* Delegation (SCR-03, US-04) */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-muted" />
              <CardTitle>결제 실무 위임</CardTitle>
            </div>
            {delegateEmail ? <Badge tone="info">위임 중</Badge> : null}
          </div>
          <p className="mt-2 text-xs text-muted">
            인보이스 확인·세금계산서 요청을 재무 담당 직원에게 맡길 수 있습니다. 위임받은
            분은 본인 계정으로 로그인해 이 인보이스를 열람할 수 있습니다.
          </p>
          {delegateEmail ? (
            <div className="mt-4 flex items-center justify-between rounded-[12px] border border-cardline bg-info-surface px-4 py-3">
              <span className="text-sm font-medium text-ink">{delegateEmail}</span>
              <Button variant="ghost" onClick={() => saveDelegate(null)} disabled={saving}>
                <X size={14} /> 위임 해제
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex gap-2">
              <Input
                type="email"
                placeholder="담당자 이메일 (예: cfo@company.com)"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <Button
                variant="secondary"
                className="shrink-0"
                onClick={() => saveDelegate(emailInput.trim())}
                disabled={saving || !emailInput.trim()}
              >
                위임
              </Button>
            </div>
          )}
          {delegateError ? <p className="mt-2 text-xs text-danger">{delegateError}</p> : null}
        </Card>

        {/* Tax invoice */}
        <Card>
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-muted" />
            <CardTitle>세금계산서 요청</CardTitle>
          </div>
          <p className="mt-2 text-xs text-muted">
            사업자등록번호·상호·담당자 정보를 남겨 주시면 세금계산서를 발행해 드립니다.
          </p>
          <div className="mt-4">
            <Button variant="secondary" full>
              요청
            </Button>
          </div>
        </Card>

        <p className="text-center text-xs text-muted">입금 확인 시 알림톡을 보내드립니다.</p>
      </div>
    </PortalShell>
  );
}
