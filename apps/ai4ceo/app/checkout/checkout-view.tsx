"use client";

// Design Ref: PRD v3.2 C-8 / §6.11 (R8 공식 SDK만, 약관동의는 여기서 수집).
// 흐름: 약관동의 → prepare(orderId·서버금액) → SDK requestPayment → successUrl → 서버 confirm.
import { useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Button, Callout, Card, CardTitle } from "@/components/ui";
import { formatKRW } from "@/lib/core/constants";

interface CheckoutViewProps {
  invoice: { id: string; amount: number; number: string | null } | null;
  clientKey: string | null;
}

// Toss v2 표준 결제창 SDK를 런타임에 로드(외부 CDN). 공식 SDK만 사용(R8).
type TossPayment = {
  requestPayment: (opts: {
    method: string;
    amount: { currency: string; value: number };
    orderId: string;
    orderName: string;
    successUrl: string;
    failUrl: string;
  }) => Promise<void>;
};
type TossPaymentsFactory = (clientKey: string) => { payment: (o: { customerKey: string }) => TossPayment };

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

function loadTossSdk(): Promise<TossPaymentsFactory> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.TossPayments) return resolve(window.TossPayments);
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v2/standard";
    script.onload = () => (window.TossPayments ? resolve(window.TossPayments) : reject(new Error("SDK load failed")));
    script.onerror = () => reject(new Error("SDK load failed"));
    document.head.appendChild(script);
  });
}

export function CheckoutView({ invoice, clientKey }: CheckoutViewProps) {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    if (!invoice || !clientKey) return;
    setError(null);
    setBusy(true);
    try {
      // R1: 약관동의 수집 + orderId·서버금액 선저장
      const prep = await fetch("/api/payments/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, consent: { terms: true, agreedAt: new Date().toISOString() } }),
      });
      const prepData = (await prep.json()) as { orderId?: string; amount?: number; clientKey?: string; error?: string };
      if (!prep.ok || !prepData.orderId) throw new Error(prepData.error ?? "결제 준비 실패");

      const factory = await loadTossSdk();
      const tp = factory(prepData.clientKey ?? clientKey);
      const payment = tp.payment({ customerKey: `inv_${invoice.id}` });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: prepData.amount ?? invoice.amount },
        orderId: prepData.orderId,
        orderName: "AI4CEO Portal 수강료",
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제를 시작하지 못했습니다.");
      setBusy(false);
    }
  }

  return (
    <PortalShell title="결제">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardTitle>수강료 결제</CardTitle>
          {invoice ? (
            <>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-muted">청구 금액</span>
                <span className="tnum text-lg font-bold text-ink">{formatKRW(invoice.amount)}</span>
              </div>
              {invoice.number && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-faint">인보이스</span>
                  <span className="text-xs text-muted">{invoice.number}</span>
                </div>
              )}
              <label className="mt-5 flex items-start gap-2 text-sm text-ink">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
                <span>결제 진행 및 환불 규정에 동의합니다. (필수)</span>
              </label>
              {error && <Callout className="mt-4">{error}</Callout>}
              <Button
                variant="primary"
                full
                className="mt-5"
                disabled={!agreed || busy || !clientKey}
                onClick={pay}
              >
                {busy ? "결제창 여는 중…" : "결제하기"}
              </Button>
              {!clientKey && (
                <p className="mt-3 text-center text-xs text-faint">
                  <Badge tone="neutral">설정 필요</Badge> NEXT_PUBLIC_TOSS_CLIENT_KEY 미설정
                </p>
              )}
            </>
          ) : (
            <Callout className="mt-4">결제할 인보이스가 없습니다. 인보이스 발행 후 다시 시도해 주세요.</Callout>
          )}
        </Card>
      </div>
    </PortalShell>
  );
}
