"use client";

import { useState } from "react";
import { Check, Copy, Landmark, Store, FileText } from "lucide-react";
import { z } from "zod";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Button, Card, CardTitle, Input, type Tone } from "@/components/ui";
import { TUITION_KRW, formatKRW, BANK_ACCOUNT } from "@/lib/core/constants";
import { cn } from "@/lib/core/cn";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";

export interface Invoice {
  id: string;
  number: string | null;
  amount: number;
  status: "issued" | "paid" | "cancelled";
  biz_name: string | null;
  biz_reg_no: string | null;
}

interface BillingViewProps {
  enrollmentId: string | null;
  delegateEmail: string | null;
  invoice: Invoice | null;
  taxStatus: string | null;
}

const STATUS_META: Record<"issued" | "paid" | "cancelled" | "none", { label: string; tone: Tone }> = {
  issued: { label: "입금 대기", tone: "wait" },
  paid: { label: "입금 완료", tone: "done" },
  cancelled: { label: "취소됨", tone: "neutral" },
  none: { label: "발행 예정", tone: "neutral" },
};

const TIMELINE_LABELS = ["발행 완료", "입금 확인 대기", "등록 확정"] as const;

function timelineStates(status: Invoice["status"] | null): ("done" | "current" | "future")[] {
  if (status === "paid") return ["done", "done", "done"];
  if (status === "issued") return ["done", "current", "future"];
  if (status === "cancelled") return ["done", "future", "future"];
  return ["future", "future", "future"];
}

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors disabled:opacity-50",
        on ? "bg-primary" : "bg-cardline",
      )}
    >
      <span
        className={cn(
          "absolute left-[2px] top-[2px] h-[26px] w-[26px] rounded-full bg-white transition-transform",
          on && "translate-x-5",
        )}
      />
    </button>
  );
}

function DelegationPanel({
  enrollmentId,
  delegateEmail,
}: {
  enrollmentId: string | null;
  delegateEmail: string | null;
}) {
  const [current, setCurrent] = useState(delegateEmail);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(value: string | null) {
    if (!enrollmentId) return;
    setBusy(true);
    setError(null);
    try {
      const sb = getSupabaseBrowser();
      const { error: rpcError } = await sb.rpc("set_billing_delegate", { p_email: value });
      if (rpcError) throw rpcError;
      setCurrent(value);
      setInput("");
    } catch {
      setError("변경에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function submitDelegate() {
    const parsed = z.string().trim().email("이메일을 확인해 주세요.").safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "이메일을 확인해 주세요.");
      return;
    }
    await persist(parsed.data);
  }

  return (
    <Card>
      <CardTitle>결제 실무 위임</CardTitle>
      {!enrollmentId ? (
        <p className="mt-2 text-xs text-muted">등록 정보가 없어 위임 기능을 사용할 수 없습니다.</p>
      ) : current ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Badge tone="info">위임됨 · {current}</Badge>
            <Toggle on={true} disabled={busy} onToggle={() => persist(null)} />
          </div>
          <p className="text-xs text-muted">위임 변경은 대표님만 가능합니다.</p>
          <p className="text-xs text-warning">
            위임 해제 시 진행 중이던 건은 대표님께 승계되고 접근이 즉시 차단됩니다.
          </p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <Input
            type="email"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="위임할 담당자 이메일"
            disabled={busy}
          />
          <Button variant="secondary" onClick={submitDelegate} disabled={busy}>
            위임하기
          </Button>
        </div>
      )}
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </Card>
  );
}

const taxSchema = z.object({
  bizRegNo: z.string().trim().min(10, "사업자등록번호를 확인해 주세요."),
  email: z.string().trim().email("담당자 이메일을 확인해 주세요."),
});

function TaxInvoicePanel({ invoice, taxStatus }: { invoice: Invoice | null; taxStatus: string | null }) {
  const [done, setDone] = useState(Boolean(taxStatus));
  const [bizRegNo, setBizRegNo] = useState(invoice?.biz_reg_no ?? "");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!invoice) return;
    const parsed = taxSchema.safeParse({ bizRegNo, email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력을 확인해 주세요.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const sb = getSupabaseBrowser();
      const { error: rpcError } = await sb.rpc("request_tax_invoice", {
        p_invoice_id: invoice.id,
        p_biz_reg_no: parsed.data.bizRegNo,
      });
      if (rpcError) throw rpcError;
      setDone(true);
    } catch {
      setError("요청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <FileText size={16} className="text-muted" />
        <CardTitle>세금계산서 요청</CardTitle>
      </div>
      {!invoice ? (
        <p className="mt-2 text-xs text-muted">인보이스 발행 후 요청할 수 있습니다.</p>
      ) : done ? (
        <p className="mt-3 text-sm text-ink">✓ 발행 요청 완료 — 입금 확인 후 팝빌을 통해 발행됩니다.</p>
      ) : (
        <>
          <p className="mt-2 text-xs text-muted">
            사업자등록번호·담당자 정보를 남겨 주시면 세금계산서를 발행해 드립니다.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <Input
              value={bizRegNo}
              onChange={(e) => setBizRegNo(e.target.value)}
              placeholder="사업자등록번호"
              disabled={busy}
            />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="담당자 이메일"
              disabled={busy}
            />
            {error ? <p className="text-xs text-danger">{error}</p> : null}
            <Button variant="secondary" full onClick={submit} disabled={busy}>
              발행 요청
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

export function BillingView({ enrollmentId, delegateEmail, invoice, taxStatus }: BillingViewProps) {
  const [copied, setCopied] = useState(false);

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(BANK_ACCOUNT.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  const amount = invoice?.amount ?? TUITION_KRW;
  const number = invoice?.number ?? "—";
  const statusMeta = STATUS_META[invoice?.status ?? "none"];
  const steps = timelineStates(invoice?.status ?? null);

  return (
    <PortalShell title="내 결제">
      <div className="mx-auto flex max-w-[560px] flex-col gap-5">
        {/* Amount card */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted">수강료 (VAT 포함)</p>
              <p className="mt-1 text-3xl font-bold text-ink tnum">{formatKRW(amount)}</p>
              <p className="mt-1 text-xs text-muted tnum">{number}</p>
            </div>
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
          </div>

          {/* Vertical status timeline */}
          <ol className="mt-6 space-y-0">
            {TIMELINE_LABELS.map((label, i) => {
              const state = steps[i];
              return (
                <li key={label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                        state === "done" && "bg-primary text-white",
                        state === "current" && "border-2 border-primary text-primary",
                        state === "future" && "border border-cardline text-faint",
                      )}
                    >
                      {state === "done" ? <Check size={14} /> : i + 1}
                    </span>
                    {i < TIMELINE_LABELS.length - 1 ? (
                      <span className={cn("w-px flex-1", state === "done" ? "bg-primary" : "bg-cardline")} />
                    ) : null}
                  </div>
                  <div className={cn("pb-5", i === TIMELINE_LABELS.length - 1 && "pb-0")}>
                    <p className={cn("text-sm", state === "future" ? "text-muted" : "font-medium text-ink")}>
                      {label}
                    </p>
                  </div>
                </li>
              );
            })}
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

        <DelegationPanel enrollmentId={enrollmentId} delegateEmail={delegateEmail} />

        <TaxInvoicePanel invoice={invoice} taxStatus={taxStatus} />

        <p className="text-center text-xs text-muted">입금 확인 시 알림톡을 보내드립니다.</p>
      </div>
    </PortalShell>
  );
}
