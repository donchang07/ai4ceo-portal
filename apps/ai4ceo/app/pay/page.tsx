import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { SectionTitle } from "@/components/ui";
import { ProductCheckout } from "@/components/product-checkout";
import { getPublicProducts } from "@/lib/billing/products";
import { getTossClientKey } from "@/lib/billing/toss";

export const metadata: Metadata = {
  title: "수강료 결제 · AI4CEO Portal",
  description: "AI4CEO 과정 수강료와 동문 멤버십을 결제합니다.",
};

export default async function PayPage() {
  const products = await getPublicProducts();

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <SectionTitle>수강료 결제</SectionTitle>
        <p className="mt-1 text-sm text-muted">
          결제할 상품의 [결제하기]를 누르면 토스페이먼츠 결제창이 열립니다. 로그인 없이 결제하실 수 있습니다.
        </p>

        <div className="mt-6">
          <ProductCheckout products={products} clientKey={getTossClientKey()} />
        </div>

        <div className="mt-6 rounded-[15px] border border-hairline bg-surface p-5">
          <h2 className="text-sm font-bold text-ink">결제 및 환불 안내</h2>
          <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-muted">
            <li>· 결제수단은 신용·체크카드이며, 표시 금액은 모두 VAT 포함 금액입니다.</li>
            <li>· 결제 진행 시 환불 규정에 동의하는 것으로 봅니다.</li>
            <li>· 개강 전 취소는 전액 환불되며, 개강 이후에는 진행 회차를 제외한 잔여 금액을 환불합니다.</li>
            <li>
              · 환불 및 결제 문의는{" "}
              <a href="/contact" className="underline">
                문의하기
              </a>
              로 접수해 주세요.
            </li>
          </ul>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
