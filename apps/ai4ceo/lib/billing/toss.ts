// Design Ref: PRD v3.2 C-8 / §6.11 — Toss Payments 결제창 일반결제(API 개별 연동 키만).
// 대전제(R8): 공식 SDK만, 결제위젯 제외. 테스트 키(test_ck/test_sk)로 구현·검증하고,
// 사용자 결제 화면(/checkout)은 PAYMENT_TOSS_ENABLED 플래그로 게이팅(기본 off).
// 라이브 전환: env 키(test→live) 교체 + 플래그 on 만으로 추가 개발 없이 즉시 서비스.

export const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

// 결제 화면 노출 여부. Go-live 시 PAYMENT_TOSS_ENABLED=on.
export function isTossCheckoutEnabled(): boolean {
  return (process.env.PAYMENT_TOSS_ENABLED ?? "").toLowerCase() === "on";
}

// 클라이언트 키(결제창 로드용, ck). 서버에서 프론트로 주입.
export function getTossClientKey(): string | null {
  return process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || null;
}

// 시크릿 키(승인 API용, sk). 서버 전용.
export function getTossSecretKey(): string | null {
  return process.env.TOSS_SECRET_KEY || null;
}

export function isTestKey(key: string | null): boolean {
  return !!key && key.startsWith("test_");
}

export interface TossConfirmResult {
  ok: boolean;
  status: number;
  paymentKey?: string;
  orderId?: string;
  totalAmount?: number;
  raw: unknown;
  code?: string;
  message?: string;
}

// R5: Idempotency-Key = orderId. 동일 orderId 재요청 시 토스가 동일 결과를 반환한다.
// 시크릿키 Basic 인증: base64(`${secretKey}:`) — 콜론 뒤 비밀번호는 빈 문자열.
export async function confirmTossPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<TossConfirmResult> {
  const secret = getTossSecretKey();
  if (!secret) {
    return { ok: false, status: 0, raw: null, code: "NO_SECRET_KEY", message: "TOSS_SECRET_KEY 미설정" };
  }
  const auth = Buffer.from(`${secret}:`).toString("base64");
  const res = await fetch(TOSS_CONFIRM_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      "Idempotency-Key": params.orderId,
    },
    body: JSON.stringify({
      paymentKey: params.paymentKey,
      orderId: params.orderId,
      amount: params.amount,
    }),
  });
  const raw = await res.json().catch(() => ({}));
  const body = raw as { paymentKey?: string; orderId?: string; totalAmount?: number; code?: string; message?: string };
  return {
    ok: res.ok,
    status: res.status,
    paymentKey: body.paymentKey,
    orderId: body.orderId,
    totalAmount: body.totalAmount,
    code: body.code,
    message: body.message,
    raw,
  };
}
