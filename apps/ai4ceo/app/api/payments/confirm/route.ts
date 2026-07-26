// Design Ref: PRD v3.2 C-8 / §6.11 (R2 승인 종료 + R4 금액대조 + R5 멱등)
// POST /api/payments/confirm — successUrl 리다이렉트 결과를 서버가 승인 확정한다.
// 1) 서버 금액 대조(요청 amount vs DB 기록 amount) → 불일치면 승인 호출 금지·fail
// 2) orderId 멱등(이미 approved면 그대로 성공 반환)
// 3) 시크릿키 Basic + Idempotency-Key 로 Toss /v1/payments/confirm 호출
// 4) 성공 → finalize_payment_confirmed(paid), 실패 → fail_payment
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { isTossCheckoutEnabled, confirmTossPayment } from "@/lib/billing/toss";

export async function POST(req: NextRequest) {
  if (!isTossCheckoutEnabled()) {
    return Response.json({ error: "payment_disabled" }, { status: 404 });
  }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    paymentKey?: string;
    orderId?: string;
    amount?: number;
  };
  if (!body.paymentKey || !body.orderId || typeof body.amount !== "number") {
    return Response.json({ error: "paymentKey, orderId, amount required" }, { status: 400 });
  }

  const sb = await getSupabaseServer();

  // 기록된 결제 조회(소유권·금액·상태). record_payment_requested 로 선저장돼 있어야 한다.
  const { data: rows, error: lookErr } = await sb.rpc("payment_lookup", { p_order_id: body.orderId });
  const recorded = Array.isArray(rows) ? rows[0] : rows;
  if (lookErr || !recorded) {
    return Response.json({ error: "order not found" }, { status: 404 });
  }

  // R5: 멱등 — 이미 승인된 주문이면 재확정하지 않는다.
  if (recorded.status === "approved") {
    return Response.json({ ok: true, status: "approved", orderId: body.orderId, idempotent: true });
  }

  // R4: 승인 호출 '전' 서버 금액 대조. 불일치 시 토스 승인 호출하지 않고 실패 처리.
  if (body.amount !== recorded.amount) {
    await sb.rpc("fail_payment", {
      p_order_id: body.orderId,
      p_fail_code: "AMOUNT_MISMATCH",
      p_fail_message: `요청 ${body.amount} ≠ 기록 ${recorded.amount}`,
      p_raw: { request_amount: body.amount, recorded_amount: recorded.amount },
    });
    return Response.json({ error: "amount_mismatch" }, { status: 400 });
  }

  // Toss 승인 호출(Basic 인증 + Idempotency-Key=orderId)
  const result = await confirmTossPayment({
    paymentKey: body.paymentKey,
    orderId: body.orderId,
    amount: body.amount,
  });

  if (!result.ok) {
    await sb.rpc("fail_payment", {
      p_order_id: body.orderId,
      p_fail_code: result.code ?? `HTTP_${result.status}`,
      p_fail_message: result.message ?? "toss confirm failed",
      p_raw: (result.raw as Record<string, unknown>) ?? {},
    });
    return Response.json({ error: "confirm_failed", code: result.code, message: result.message }, { status: 402 });
  }

  // 승인 성공 → paid 전환(finalize 내부에서 금액 재대조·멱등)
  const { error: finErr } = await sb.rpc("finalize_payment_confirmed", {
    p_order_id: body.orderId,
    p_payment_key: result.paymentKey ?? body.paymentKey,
    p_amount: result.totalAmount ?? body.amount,
    p_raw: (result.raw as Record<string, unknown>) ?? {},
  });
  if (finErr) return Response.json({ error: finErr.message }, { status: 500 });

  return Response.json({ ok: true, status: "approved", orderId: body.orderId });
}
