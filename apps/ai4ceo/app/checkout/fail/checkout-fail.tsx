"use client";

// Design Ref: PRD v3.2 §6.11 — failUrl(code·message) 안내 + 실패 원장 기록.
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { Button, Callout, Card, CardTitle } from "@/components/ui";

export function CheckoutFail() {
  const params = useSearchParams();
  const code = params.get("code") ?? "UNKNOWN";
  const message = params.get("message") ?? "결제가 취소되었거나 실패했습니다.";
  const orderId = params.get("orderId");

  useEffect(() => {
    if (!orderId) return;
    // 실패/취소를 원장에 기록(fail_payment). best-effort.
    fetch("/api/payments/fail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, code, message }),
    }).catch(() => {});
  }, [orderId, code, message]);

  return (
    <PortalShell title="결제 결과">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardTitle>결제 실패</CardTitle>
          <Callout className="mt-4">
            {message} ({code})
          </Callout>
          <Button href="/checkout" variant="outline" full className="mt-5">다시 시도</Button>
        </Card>
      </div>
    </PortalShell>
  );
}
