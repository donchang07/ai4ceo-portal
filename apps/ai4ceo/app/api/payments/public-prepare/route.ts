// POST /api/payments/public-prepare — 공개 결제 페이지(/pay)용 주문 발급.
// 로그인·인보이스 없이 결제창을 띄우기 위한 경로이며, 금액과 orderId는 서버에서만 확정한다.
// 수강생용 /checkout(인보이스 기반, PAYMENT_TOSS_ENABLED 게이팅)과는 별개 경로다.
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { findPublicProduct } from "@/lib/billing/products";
import { getTossClientKey } from "@/lib/billing/toss";

export async function POST(req: NextRequest) {
  const clientKey = getTossClientKey();
  if (!clientKey) {
    return Response.json({ error: "NEXT_PUBLIC_TOSS_CLIENT_KEY 미설정" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as { productCode?: string };
  const product = body.productCode ? findPublicProduct(body.productCode) : null;
  if (!product) return Response.json({ error: "unknown product" }, { status: 400 });

  return Response.json({
    orderId: `AI4CEO-${product.code.toUpperCase()}-${randomUUID().replace(/-/g, "").slice(0, 16)}`,
    amount: product.amount,
    orderName: product.name,
    clientKey,
  });
}
