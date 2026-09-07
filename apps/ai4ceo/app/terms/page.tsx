import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { getCurrentUser } from "@/lib/db/auth";
import { SiteFooter } from "@/components/site-footer";
import { SectionTitle } from "@/components/ui";
import { getPublicProducts } from "@/lib/billing/products";
import { BUSINESS_INFO, formatKRW } from "@/lib/core/constants";

// 토스페이먼츠 심사 요건 — 환불정책을 결제 페이지와 별개의 고정 URL(/terms)에서 확인할 수 있어야 한다.
export const metadata: Metadata = {
  title: "결제 및 환불 정책 · AI4CEO Portal",
  description: "AI4CEO 과정 수강료와 동문 멤버십의 결제수단, 서비스 제공기간, 환불 규정을 안내합니다.",
};

const BUSINESS_ROWS: [string, string][] = [
  ["상호명", BUSINESS_INFO.name],
  ["대표자명", BUSINESS_INFO.ceo],
  ["사업자등록번호", BUSINESS_INFO.registrationNumber],
  ["사업장 주소", BUSINESS_INFO.address],
  ["연락번호", BUSINESS_INFO.phone],
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      <div className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default async function TermsPage() {
  const [products, user] = await Promise.all([getPublicProducts(), getCurrentUser()]);

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader user={user} />
      <main className="mx-auto max-w-[820px] px-6 py-10">
        <SectionTitle>결제 및 환불 정책</SectionTitle>
        <p className="mt-1 text-sm text-muted">
          AI4CEO 과정 수강료와 동문 멤버십의 결제수단, 서비스 제공기간, 환불 규정을 안내합니다.
        </p>

        <Section title="1. 판매자 정보">
          <dl className="space-y-1.5">
            {BUSINESS_ROWS.map(([label, value]) => (
              <div key={label} className="flex flex-wrap gap-x-2">
                <dt className="shrink-0 font-medium text-ink">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="2. 판매 상품과 서비스 제공기간">
          <ul className="space-y-3">
            {products.map((p) => (
              <li key={p.code}>
                <p className="font-semibold text-ink">
                  {p.name} · {formatKRW(p.amount)} (VAT 포함)
                </p>
                <p>· {p.summary}</p>
                <p>· 서비스 제공기간 — {p.period}</p>
              </li>
            ))}
          </ul>
          <p>
            · 모든 상품은 Zoom 온라인 강의와 웹 학습 포털로 제공되는 무형의 서비스이며, 별도의 배송이 발생하지
            않습니다.
          </p>
        </Section>

        <Section title="3. 결제수단">
          <p>· 신용·체크카드, 계좌이체, 가상계좌(무통장입금)로 결제하실 수 있습니다.</p>
          <p>· 표시된 금액은 모두 VAT가 포함된 금액이며, 정기 결제(자동 결제)는 사용하지 않습니다.</p>
          <p>· 로그인 없이 결제하실 수 있고, 세금계산서는 결제 후 학습 포털에서 신청하실 수 있습니다.</p>
        </Section>

        <Section title="4. 환불 규정">
          <p className="font-semibold text-ink">수강료</p>
          <p>· 개강 전에 취소하시면 결제하신 금액 전액을 환불해 드립니다.</p>
          <p>
            · 개강 후에는 이미 진행된 회차분을 제외한 잔여 회차 금액을 환불해 드립니다. (회차당 금액 = 수강료 ÷ 총
            정규 강의 회차)
          </p>
          <p>· 전 회차가 종료된 후에는 환불되지 않습니다.</p>
          <p className="pt-2 font-semibold text-ink">동문 멤버십</p>
          <p>· 이용을 시작하기 전에는 결제하신 금액 전액을 환불해 드립니다.</p>
          <p>· 이용 시작 후에는 남은 이용기간을 일할 계산해 환불해 드리며, 별도의 위약금은 없습니다.</p>
        </Section>

        <Section title="5. 환불 절차">
          <p>
            · 환불은{" "}
            <Link href="/contact" className="underline">
              문의하기
            </Link>
            로 접수해 주시면 확인 후 3영업일 이내에 처리해 드립니다.
          </p>
          <p>· 환불 금액은 결제하신 수단으로 되돌려 드리며, 카드사·은행 사정에 따라 입금까지 3~5영업일이 더 걸릴 수 있습니다.</p>
          <p>· 결제 진행 시 본 환불 규정에 동의하신 것으로 봅니다.</p>
        </Section>

        <Section title="6. 문의">
          <p>
            · 결제·환불·세금계산서 관련 문의는{" "}
            <Link href="/contact" className="underline">
              문의하기
            </Link>
            {" "}또는 {BUSINESS_INFO.phone} 으로 연락해 주세요.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
