// 공개 결제(/pay, 첫페이지 상품 섹션)에서 공용으로 쓰는 토스 표준 결제창 호출.
// 공식 SDK(js.tosspayments.com/v2/standard)만 사용한다 (R8).
// 금액·주문번호는 /api/payments/public-prepare 가 서버에서 확정한다.

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

export async function startTossCheckout(productCode: string): Promise<void> {
  const prep = await fetch("/api/payments/public-prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productCode }),
  });
  const data = (await prep.json()) as {
    orderId?: string;
    amount?: number;
    orderName?: string;
    clientKey?: string;
    error?: string;
  };
  if (!prep.ok || !data.orderId || !data.clientKey || typeof data.amount !== "number") {
    throw new Error(data.error ?? "결제 준비에 실패했습니다.");
  }

  const factory = await loadTossSdk();
  const payment = factory(data.clientKey).payment({ customerKey: `guest_${data.orderId.slice(-16)}` });
  await payment.requestPayment({
    method: "CARD",
    amount: { currency: "KRW", value: data.amount },
    orderId: data.orderId,
    orderName: data.orderName ?? "AI4CEO Portal",
    successUrl: `${window.location.origin}/pay/complete`,
    failUrl: `${window.location.origin}/pay/fail`,
  });
}
