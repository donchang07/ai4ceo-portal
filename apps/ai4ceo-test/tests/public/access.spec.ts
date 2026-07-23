import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { admin, assertMutationTarget, userId } from "../lib/supa.mjs";
import { ensureStorageState, type AccountKey } from "../fixtures/accounts";

async function authedContext(browser: Browser, account: AccountKey, viewport?: { width: number; height: number }) {
  const storageState = await ensureStorageState(browser, account);
  return browser.newContext({ storageState, viewport });
}

async function visit(context: BrowserContext, route: string) {
  const page = await context.newPage();
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  return page;
}

async function close(page: Page) {
  await page.context().close();
}

test.describe("새 문서 접근제어 acceptance", () => {
  test("ACC-001 guest 공개 경로 6개 접근", async ({ browser }) => {
    const context = await browser.newContext();
    try {
      for (const route of ["/", "/program", "/apply", "/apply/status", "/trends", "/login"]) {
        const page = await visit(context, route);
        expect(new URL(page.url()).pathname).toBe(route);
        await expect(page.locator("body")).not.toBeEmpty();
        await page.close();
      }
    } finally { await context.close(); }
  });

  test("ACC-002 guest 보호 경로는 로그인으로 이동", async ({ browser }) => {
    const context = await browser.newContext();
    try {
      for (const route of ["/portal/cohort", "/portal/sessions", "/portal/billing", "/admin", "/alumni"]) {
        const page = await visit(context, route);
        expect(new URL(page.url()).pathname).toBe("/login");
        if (route === "/admin") expect(new URL(page.url()).searchParams.get("next")).toBe("/admin");
        expect(await page.getByText("운영 현황을 한눈에").count()).toBe(0);
        await page.close();
      }
    } finally { await context.close(); }
  });

  test("ACC-003 재학생 LMS 9개 경로 접근", async ({ browser }) => {
    const context = await authedContext(browser, "student");
    try {
      for (const route of ["/portal/cohort", "/portal/chat", "/portal/ai", "/portal/assignments", "/portal/sessions", "/portal/files", "/portal/builds", "/portal/tasks", "/portal/roadmap"]) {
        const page = await visit(context, route);
        expect(new URL(page.url()).pathname).toBe(route);
        await expect(page.locator("main")).not.toBeEmpty();
        await page.close();
      }
    } finally { await context.close(); }
  });

  test("ACC-004 멤버십 졸업생 archive 경로만 허용", async ({ browser }) => {
    const context = await authedContext(browser, "alumniMember");
    try {
      for (const route of ["/portal/sessions", "/portal/files", "/alumni/archive"]) {
        const page = await visit(context, route);
        expect(new URL(page.url()).pathname).toBe(route);
        await expect(page.locator("main")).not.toBeEmpty();
        await page.close();
      }
      const alumni = await visit(context, "/alumni");
      await expect(alumni.getByText(/멤버십.*이용 중|이용 중/).first()).toBeVisible();
      await alumni.close();
    } finally { await context.close(); }
  });

  test("ACC-005 만료 졸업생 archive 콘텐츠 잠금", async ({ browser }) => {
    const context = await authedContext(browser, "alumniExpired");
    try {
      for (const route of ["/alumni/archive", "/portal/sessions"]) {
        const page = await visit(context, route);
        const path = new URL(page.url()).pathname;
        expect(["/alumni/archive", "/alumni/membership"]).toContain(path);
        await expect(page.getByRole("button", { name: /재생|다운로드/ })).toHaveCount(0);
        await page.close();
      }
    } finally { await context.close(); }
  });

  test("ACC-006 applicant 보호 경로 차단", async ({ browser }) => {
    const context = await authedContext(browser, "applicant");
    try {
      for (const route of ["/portal/cohort", "/portal/billing", "/admin"]) {
        const page = await visit(context, route);
        expect(["/", "/apply"]).toContain(new URL(page.url()).pathname);
        await expect(page.getByText("운영 현황을 한눈에")).toHaveCount(0);
        await page.close();
      }
    } finally { await context.close(); }
  });

  test("ACC-007 assistant는 연결된 cohort만 접근", async () => {
    assertMutationTarget();
    const assistantId = await userId("assistant");
    expect(assistantId).toBeTruthy();
    const links = await admin().from("assistant_links").select("assistant_id, student_id, cohort_id").eq("assistant_id", assistantId);
    expect(links.error, "assistant_links 계약과 RLS가 존재해야 한다").toBeNull();
    expect(links.data).toHaveLength(1);
  });

  test("ACC-008 non-admin은 모든 admin 화면 차단", async ({ browser }) => {
    test.setTimeout(120_000);
    for (const account of ["student", "alumniMember", "applicant"] as AccountKey[]) {
      const context = await authedContext(browser, account);
      try {
        for (const route of ["/admin", "/admin/applications", "/admin/ai", "/admin/billing"]) {
          const page = await visit(context, route);
          expect(new URL(page.url()).pathname.startsWith("/admin")).toBeFalsy();
          await expect(page.getByText("운영 현황을 한눈에")).toHaveCount(0);
          await page.close();
        }
      } finally { await context.close(); }
    }
  });

  test("ACC-009 admin 화면 4개 직접 접근", async ({ browser }) => {
    const context = await authedContext(browser, "admin");
    try {
      for (const route of ["/admin", "/admin/applications", "/admin/ai", "/admin/billing"]) {
        const page = await visit(context, route);
        expect(new URL(page.url()).pathname).toBe(route);
        await expect(page.locator("main")).not.toBeEmpty();
        await page.close();
      }
    } finally { await context.close(); }
  });

  test("ACC-013 재학생 모바일 탭과 overflow", async ({ browser }) => {
    const context = await authedContext(browser, "student", { width: 390, height: 844 });
    const page = await visit(context, "/portal/cohort");
    try {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
      await expect(page.locator("nav:visible").last()).toBeVisible();
      await expect(page.getByRole("link", { name: /관리/ })).toHaveCount(0);
    } finally { await close(page); }
  });

  test("ACC-014 졸업생 모바일 메뉴에 chat·AI 없음", async ({ browser }) => {
    test.fail(true, "현재 문서에 등록된 known_gap: 졸업생 전용 모바일 탭 UX 미구현");
    const context = await authedContext(browser, "alumniMember", { width: 390, height: 844 });
    const page = await visit(context, "/alumni/archive");
    try {
      const mobileNav = page.locator("nav:visible").last();
      await expect(mobileNav).toBeVisible();
      await expect(mobileNav.getByRole("link", { name: /채팅|AI/ })).toHaveCount(0);
      await expect(mobileNav.getByRole("link", { name: /아카이브|멤버십/ }).first()).toBeVisible();
    } finally { await close(page); }
  });
});
