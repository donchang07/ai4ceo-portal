// 공개 결제 페이지(/pay)와 첫페이지 상품 섹션에서 판매하는 상품 목록.
// 토스페이먼츠 심사 요건 — 홈페이지에 결제 가능한 상품이 1개 이상 게시되어 있어야 한다.
// 금액은 서버 소스가 유일한 기준이며, 프론트가 보낸 금액은 신뢰하지 않는다.
import { TUITION_KRW, MEMBERSHIP_KRW, COHORT_18 } from "@/lib/core/constants";
import { getCohortSchedule } from "@/lib/db/cohort-schedule";
import type { ArtworkKey } from "@/components/product-artwork";

export interface PublicProduct {
  code: string;
  name: string;
  amount: number;
  summary: string;
  details: string[];
  artwork: ArtworkKey;
  /**
   * 결제 시점부터 서비스 제공이 끝날 때까지의 기간.
   * 토스페이먼츠 심사 요건 — 구매자가 인지할 수 있도록 상품 페이지에 반드시 노출해야 하며,
   * 12개월을 넘기면 입점이 불가하므로 어떤 상품도 12개월을 초과해선 안 된다.
   */
  period: string;
  /** 구매 전 반드시 고지해야 하는 이용 조건 (없으면 표시하지 않음) */
  notice?: string;
}

export const PUBLIC_PRODUCTS: PublicProduct[] = [
  {
    code: "tuition-18",
    name: `AI4CEO ${COHORT_18.name} 수강료`,
    amount: TUITION_KRW,
    summary: "CEO를 위한 AI 실전 과정 — Zoom 온라인 진행",
    details: [
      "Claude Code · Design · Cowork · Harness 4대 트랙",
      "수강생 전용 포털(LMS)·AI 조교·다시보기 제공",
    ],
    artwork: "tuition",
    period: "개강일부터 종강일까지 약 3개월 (매주 수요일 정규 강의 10회)",
  },
  {
    code: "membership-alumni",
    name: "동문 멤버십 (연간)",
    amount: MEMBERSHIP_KRW,
    summary: "결제일부터 1년간 동문 네트워크·자료 업데이트 이용권",
    details: [
      "동문 디렉터리 및 네트워킹 세션 참여",
      "버전 팩·최신 커리큘럼 자료 업데이트",
      "AI 조교 계속 이용",
    ],
    artwork: "membership",
    period: "결제일로부터 12개월",
    notice:
      "동문 멤버십은 AI4CEO 과정을 수료하신 분을 위한 이용권입니다. 결제일로부터 12개월간 이용하실 수 있으므로 수료 후에 결제하시기를 권해 드립니다. 멤버십만 단독으로 이용하실 수는 없습니다.",
  },
];

export function findPublicProduct(code: string): PublicProduct | null {
  return PUBLIC_PRODUCTS.find((p) => p.code === code) ?? null;
}

/**
 * 화면에 뿌릴 상품 목록. 수강료 카드의 일정 문구는 sessions 에서 읽어 앞에 붙인다.
 * 서버 컴포넌트에서만 호출할 것.
 */
export async function getPublicProducts(): Promise<PublicProduct[]> {
  const schedule = await getCohortSchedule();
  if (!schedule) return PUBLIC_PRODUCTS;

  return PUBLIC_PRODUCTS.map((p) =>
    p.code === "tuition-18" ? { ...p, details: [schedule.label, ...p.details] } : p,
  );
}
