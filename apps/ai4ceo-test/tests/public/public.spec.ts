import { expect, test, type Page } from "@playwright/test";

function collectPageErrors(page: Page): Error[] {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  return errors;
}

test.describe("공개 사이트 P0 acceptance", () => {
  test("PUB-001 홈 공개 접근과 지원 CTA", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("body")).not.toBeEmpty();
    const applyCta = page.getByRole("link", { name: /지원하기/ }).first();
    await expect(applyCta).toBeVisible();
    await expect(applyCta).toHaveAttribute("href", "/apply");
    expect(pageErrors, "console page error가 없어야 한다").toEqual([]);
  });

  test("PUB-002 18기 일정과 과정 핵심 정보", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/program", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/program$/);
    await expect.soft(page.getByText(/2026년\s*9월\s*7일/).first()).toBeVisible();
    await expect.soft(page.getByText(/총\s*10회|10회/).first()).toBeVisible();
    await expect.soft(page.getByText(/18:00\s*[~～-]\s*21:00/).first()).toBeVisible();
    await expect.soft(page.getByText(/Zoom/).first()).toBeVisible();
    await expect.soft(page.getByText(/4대\s*(핵심\s*)?트랙/).first()).toBeVisible();
    await expect.soft(page.getByText(/9\/9\s*\(수\)/)).toHaveCount(0);
    expect.soft(pageErrors, "console page error가 없어야 한다").toEqual([]);
  });

  test("PUB-003 과정 페이지 통합 FAQ와 키보드 조작", async ({ page }) => {
    const pageErrors = collectPageErrors(page);

    await page.goto("/program", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "자주 묻는 질문" })).toBeVisible();
    for (const keyword of ["지원 자격", "결제", "환불"]) {
      await expect.soft(page.getByText(new RegExp(keyword)).first(), `${keyword} FAQ가 보여야 한다`).toBeVisible();
    }

    const faqControls = page.locator('button[aria-expanded][aria-controls^="program-faq-"]');
    expect.soft(await faqControls.count(), "키보드로 열 수 있는 FAQ 버튼이 3개 이상이어야 한다").toBeGreaterThanOrEqual(3);
    if ((await faqControls.count()) > 0) {
      const firstFaq = faqControls.first();
      await firstFaq.focus();
      await page.keyboard.press("Enter");
      await expect.soft(firstFaq).toHaveAttribute("aria-expanded", "true");
    }
    expect.soft(pageErrors, "console page error가 없어야 한다").toEqual([]);
  });

  test("PUB-004 공개 페이지 metadata, canonical, OG, sitemap", async ({ page, request }) => {
    test.fail(true, "현재 문서에 등록된 known_gap: 공개 페이지 SEO 계약 미완성");
    for (const route of ["/", "/program", "/apply", "/trends"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect.soft(page).toHaveTitle(/.+/);
      await expect.soft(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
      await expect.soft(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https?:\/\//);
      await expect.soft(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/);
      await expect.soft(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /^https?:\/\//);
      await expect.soft(page.locator('meta[name="robots"]')).not.toHaveAttribute("content", /noindex/i);
    }
    const sitemap = await request.get("/sitemap.xml");
    expect.soft(sitemap.ok()).toBeTruthy();
    const body = await sitemap.text();
    for (const route of ["/program", "/apply", "/trends"]) expect.soft(body).toContain(route);
  });

  test("PUB-005 비개발자 자가진단 5문항과 결과 CTA", async ({ page }) => {
    await page.goto("/program", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/자가진단|진단 시작/).first()).toBeVisible();
    for (const answer of [
      "전혀 없다",
      "3시간 이상",
      "논의만 있고 실행 전",
      "명확히 있다",
      "CEO·임원 (의사결정권자)",
    ]) {
      await page.getByRole("button", { name: answer, exact: true }).click();
    }
    await expect(page.getByText(/적극 추천|추천|상담 권장/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "18기 지원하기" })).toHaveAttribute("href", "/apply");
  });

  test("PUB-006 과정 비교 세 축과 비교 대상 3종", async ({ page }) => {
    await page.goto("/program", { waitUntil: "domcontentloaded" });
    for (const axis of ["직접 만드는 실습", "CEO의 의사결정 관점", "수료 후 지속"]) {
      await expect.soft(page.getByText(new RegExp(axis)).first()).toBeVisible();
    }
    const comparison = page.locator("table").filter({ hasText: /본 과정/ });
    await expect(comparison).toBeVisible();
    expect(await comparison.locator("thead th").count()).toBeGreaterThanOrEqual(4);
  });
});
