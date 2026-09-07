import Link from "next/link";
import { BUSINESS_INFO, COHORT_18 } from "@/lib/core/constants";

// 토스페이먼츠 심사 요건 — 홈페이지 하단에 사업자등록증과 동일한 사업자정보 5종을 노출한다.
const ROWS: [string, string][] = [
  ["상호명", BUSINESS_INFO.name],
  ["대표자명", BUSINESS_INFO.ceo],
  ["사업자등록번호", BUSINESS_INFO.registrationNumber],
  ["사업장 주소", BUSINESS_INFO.address],
  ["연락번호", BUSINESS_INFO.phone],
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-[1100px] px-6 py-10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-muted">
          <span>AI4CEO Portal · {COHORT_18.versionLabel}</span>
          <Link href="/program" className="hover:text-ink">과정 소개</Link>
          <Link href="/pay" className="hover:text-ink">수강료 결제</Link>
          <Link href="/terms" className="hover:text-ink">결제 및 환불 정책</Link>
          <Link href="/contact" className="hover:text-ink">문의하기</Link>
        </div>

        <dl className="mt-5 space-y-1.5 text-xs leading-relaxed text-faint">
          {ROWS.map(([label, value]) => (
            <div key={label} className="flex flex-wrap gap-x-2">
              <dt className="shrink-0 font-medium">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 text-xs text-faint">
          © {new Date().getFullYear()} {BUSINESS_INFO.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
