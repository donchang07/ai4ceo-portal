// Design Ref: PRD v3.2 §6.11 — 결제 실패/취소를 원장(payment_events.failed)에 기록.
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { isTossCheckoutEnabled } from "@/lib/billing/toss";

export async function POST(req: NextRequest) {
  if (!isTossCheckoutEnabled()) {
    return Response.json({ error: "payment_disabled" }, { status: 404 });
  }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    orderId?: string;
    code?: string;
    message?: string;
  };
  if (!body.orderId) return Response.json({ error: "orderId required" }, { status: 400 });

  const sb = await getSupabaseServer();
  const { error } = await sb.rpc("fail_payment", {
    p_order_id: body.orderId,
    p_fail_code: body.code ?? "USER_CANCEL",
    p_fail_message: body.message ?? "결제 실패/취소",
    p_raw: {},
  });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
