"use client";

// 상품 카드 그리드 — 첫페이지 [수강료 안내] 섹션과 /pay 결제 페이지가 함께 쓴다.
// 카드마다 결제 버튼을 두어 어느 화면에서든 바로 결제창을 띄운다.
import { useState } from "react";
import { Callout } from "@/components/ui";
import { ProductCard } from "@/components/product-card";
import { startTossCheckout } from "@/lib/billing/toss-checkout";
import type { PublicProduct } from "@/lib/billing/products";

export function ProductCheckout({ products, clientKey }: { products: PublicProduct[]; clientKey: string | null }) {
  const [payingCode, setPayingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pay(code: string) {
    setError(null);
    setPayingCode(code);
    try {
      await startTossCheckout(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제를 시작하지 못했습니다.");
      setPayingCode(null);
    }
  }

  return (
    <div>
      <div className="grid gap-5 md:grid-cols-2">
        {products.map((p) => (
          <ProductCard
            key={p.code}
            product={p}
            onPay={() => void pay(p.code)}
            paying={payingCode === p.code}
            disabled={!clientKey || (payingCode !== null && payingCode !== p.code)}
          />
        ))}
      </div>

      {error && <Callout className="mt-4">{error}</Callout>}
      {!clientKey && (
        <Callout className="mt-4">결제 설정이 완료되지 않았습니다. (NEXT_PUBLIC_TOSS_CLIENT_KEY 미설정)</Callout>
      )}
    </div>
  );
}
