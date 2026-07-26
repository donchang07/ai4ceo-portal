"use client";

// Design Ref: PRD v3.2 §6.11 — successUrl 도착 후 서버 confirm 승인 요청.
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { Button, Callout, Card, CardTitle } from "@/components/ui";

export function CheckoutSuccess() {
  const params = useSearchParams();
  const [state, setState] = useState<"confirming" | "ok" | "error">("confirming");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId");
    const amount = Number(params.get("amount"));
    if (!paymentKey || !orderId || !amount) {
      setState("error");
      setMessage("결제 정보가 올바르지 않습니다.");
      return;
    }
    fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
        if (res.ok && data.ok) {
          setState("ok");
        } else {
          setState("error");
          setMessage(data.message ?? data.error ?? "결제 승인에 실패했습니다.");
        }
      })
      .catch(() => {
        setState("error");
        setMessage("결제 승인 중 오류가 발생했습니다.");
      });
  }, [params]);

  return (
    <PortalShell title="결제 결과">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardTitle>{state === "ok" ? "결제 완료" : state === "error" ? "결제 실패" : "결제 확인 중"}</CardTitle>
          {state === "confirming" && <Callout className="mt-4">결제를 확인하고 있습니다…</Callout>}
          {state === "ok" && (
            <>
              <Callout className="mt-4">결제가 정상 승인되었습니다. 등록이 확정되었습니다.</Callout>
              <Button href="/portal/billing" variant="primary" full className="mt-5">청구 내역으로</Button>
            </>
          )}
          {state === "error" && (
            <>
              <Callout className="mt-4">{message}</Callout>
              <Button href="/checkout" variant="outline" full className="mt-5">다시 시도</Button>
            </>
          )}
        </Card>
      </div>
    </PortalShell>
  );
}
