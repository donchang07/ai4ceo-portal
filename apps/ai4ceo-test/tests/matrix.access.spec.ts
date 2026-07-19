// FR-5/6: 접근 매트릭스 E2E. 02-access-control.md 전수 매트릭스를 데이터 테이블로 순회.
// (계정 × 라우트)마다 리다이렉트 체인 최종 착지 경로를 단언. 테스트 title 접두에 케이스 ID.
import { test, expect, type BrowserContext, type Page, type Locator } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(__dirname, ".env.local") });

// @ts-expect-error — .mjs 공유 데이터(타입 없음)
import { MATRIX, ROUTES, ROUTE_ORDER, CELL_CASE_ID } from "./lib/matrix.mjs";
import { ensureStorageState, type AccountKey } from "./fixtures/accounts";

const AUTHED: AccountKey[] = ["admin", "student", "alumniMember", "alumniNoMember", "applicant"];

// FR-5: 접근 성공(O) 셀마다 라우트 고유 DOM 마커가 실제 렌더되는지 확인(URL 위조/빈페이지 방지).
// 데스크톱·모바일 뷰포트 양쪽에서 보이는 본문 콘텐츠를 마커로 선택(shell 헤더는 md:inline 이라 제외).
const MARKERS: Record<string, (p: Page) => Locator> = {
  cohort: (p) => p.getByText("My Build").first(),
  chat: (p) => p.getByText("멤버 24명").first(),
  ai: (p) => p.getByPlaceholder("무엇이든 물어보세요"),
  assignments: (p) => p.getByRole("heading", { name: "과제" }).first(),
  sessions: (p) => p.getByRole("heading", { name: "세션" }).first(),
  sessionDetail: (p) => p.getByText("강의자료").first(), // LMS-V09/M04: 자료 목록 렌더
  files: (p) => p.getByRole("heading", { name: "자료" }).first(),
  billing: (p) => p.getByText("결제 방법").first(),
  // "AS Q&A" 는 모바일에서 숨김 네비 앵커로도 존재 → 카드 배지("영업일 3일")로 본문 렌더 확인
  alumni: (p) => p.getByText("영업일 3일").first(),
  membership: (p) => p.getByText(/멤버십 (가입|갱신)하기/).first(),
  // "운영 대시보드" 는 admin-shell 사이드바 네비에도 존재(모바일 숨김) → 페이지 부제로 본문 확인
  admin: (p) => p.getByText("운영 현황을 한눈에").first(),
};

// 실제 착지 경로가 기대와 일치하는지 + O 셀은 라우트 고유 DOM 마커까지 검증
async function assertLanding(
  context: BrowserContext,
  routeKey: string,
  routePath: string,
  expected: string,
) {
  const page = await context.newPage();
  try {
    await page.goto(routePath, { waitUntil: "domcontentloaded" });
    // 클라이언트 리다이렉트(로그인 후 router.push 등) 여유
    await page.waitForLoadState("networkidle").catch(() => {});
    const pathname = new URL(page.url()).pathname;
    if (expected === "O") {
      expect(pathname, `expected 접근 허용(O) at ${routePath}`).toBe(routePath);
      const marker = MARKERS[routeKey];
      if (marker) {
        await expect(
          marker(page),
          `expected DOM 마커 노출 at ${routePath}`,
        ).toBeVisible({ timeout: 15_000 });
      }
    } else {
      expect(pathname, `expected 리다이렉트 → ${expected} from ${routePath}`).toBe(expected);
    }
  } finally {
    await page.close();
  }
}

for (const account of AUTHED) {
  test.describe.serial(`매트릭스 · ${account}`, () => {
    let context: BrowserContext;

    test.beforeAll(async ({ browser }) => {
      const state = await ensureStorageState(browser, account);
      context = await browser.newContext({ storageState: state });
    });

    test.afterAll(async () => {
      await context?.close();
    });

    if (account === "admin") {
      // AC-01~13: admin 전 라우트 접근 — 전부 O (게이트 전면 우회)
      for (let i = 1; i <= 13; i++) {
        const routeKey = ROUTE_ORDER[(i - 1) % ROUTE_ORDER.length];
        const id = `AC-${String(i).padStart(2, "0")}`;
        test(`${id} admin ${routeKey} 접근 O`, async () => {
          await assertLanding(context, routeKey, ROUTES[routeKey], "O");
        });
      }
    } else {
      for (const routeKey of ROUTE_ORDER) {
        const expected = MATRIX[account][routeKey];
        const caseId = CELL_CASE_ID[`${account}|${routeKey}`];
        const title = caseId
          ? `${caseId} ${account} ${routeKey} → ${expected}`
          : `[matrix] ${account} ${routeKey} → ${expected}`;
        test(title, async () => {
          await assertLanding(context, routeKey, ROUTES[routeKey], expected);
        });
      }
    }
  });
}

// 비로그인(guest) — 별도 컨텍스트(스토리지 없음)
test.describe.serial("매트릭스 · guest", () => {
  let context: BrowserContext;
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
  });
  test.afterAll(async () => {
    await context?.close();
  });
  for (const routeKey of ROUTE_ORDER) {
    const expected = MATRIX.guest[routeKey];
    const caseId = CELL_CASE_ID[`guest|${routeKey}`];
    const title = caseId
      ? `${caseId} guest ${routeKey} → ${expected}`
      : `[matrix] guest ${routeKey} → ${expected}`;
    test(title, async () => {
      await assertLanding(context, routeKey, ROUTES[routeKey], expected);
    });
  }
});
