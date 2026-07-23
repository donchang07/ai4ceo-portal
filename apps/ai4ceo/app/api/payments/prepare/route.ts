// Design Ref: PRD v3.2 C-8 / §6.11 (R1 결제 시작 영속화)
// POST /api/payments/prepare — 약관 동의 수집 + orderId 발급 + payments(pending) 선저장.
// R4: 금액은 프론트가 아니라 서버(invoice.amount)에서 확정한다.
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { isTossCheckoutEnabled, getTossClientKey } from "@/lib/billing/toss";

export async function POST(req: NextRequest) {
  if (!isTossCheckoutEnabled()) {
    return Response.json({ error: "payment_disabled" }, { status: 404 });
  }
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    invoiceId?: string;
    consent?: Record<string, unknown>;
  };
  if (!body.invoiceId) return Response.json({ error: "invoiceId required" }, { status: 400 });

  const sb = await getSupabaseServer();
  // invoice.amount 서버 조회(RLS: 본인/위임/admin). 프론트 금액은 신뢰하지 않는다.
  const { data: invoice, error: invErr } = await sb
    .from("invoices")
    .select("id, amount, status")
    .eq("id", body.invoiceId)
    .maybeSingle();
  if (invErr || !invoice) return Response.json({ error: "invoice not found" }, { status: 404 });
  if (invoice.status === "paid") return Response.json({ error: "already paid" }, { status: 409 });

  const orderId = `TOSS-${invoice.id.replace(/-/g, "").slice(0, 12)}-${randomUUID().slice(0, 8)}`;

  const { data: savedOrder, error: rpcErr } = await sb.rpc("record_payment_requested", {
    p_invoice_id: invoice.id,
    p_provider: "toss",
    p_order_id: orderId,
    p_amount: invoice.amount,
    p_consent: body.consent ?? {},
  });
  if (rpcErr) return Response.json({ error: rpcErr.message }, { status: 400 });

  return Response.json({
    orderId: savedOrder ?? orderId,
    amount: invoice.amount,
    clientKey: getTossClientKey(),
    orderName: "AI4CEO Portal 수강료",
  });
}
