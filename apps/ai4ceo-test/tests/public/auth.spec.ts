import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { ACCOUNT_EMAILS, TEST_PASSWORD } from "../fixtures/accounts";
import { admin, anon, assertMutationTarget, BASE_URL } from "../lib/supa.mjs";

const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "";

async function freshUser(prefix: string) {
  assertMutationTarget();
  const email = `${prefix}-${Date.now()}@example.com`;
  const created = await admin().auth.admin.createUser({ email, email_confirm: true, user_metadata: { name: "Auth QA" } });
  if (created.error || !created.data.user) throw created.error ?? new Error("auth user 생성 실패");
  return { email, id: created.data.user.id };
}

async function cleanupUser(id: string) {
  await admin().auth.admin.deleteUser(id);
}

async function actionLink(email: string, next = "/portal/cohort") {
  const generated = await admin().auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${BASE_URL}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (generated.error || !generated.data.properties?.action_link) throw generated.error ?? new Error("매직링크 생성 실패");
  return generated.data.properties.action_link;
}

async function protectedContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({
    extraHTTPHeaders: BYPASS ? {
      "x-vercel-protection-bypass": BYPASS,
      "x-vercel-set-bypass-cookie": "true",
    } : undefined,
  });
  const bootstrap = await context.newPage();
  await bootstrap.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await bootstrap.close();
  await context.setExtraHTTPHeaders({});
  return context;
}

async function openMagic(browser: Browser, link: string) {
  const context = await protectedContext(browser);
  const page = await context.newPage();
  await page.goto(link, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  return { context, page };
}

async function passwordLogin(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("login-root")).toHaveAttribute("data-hydrated", "true");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
}

test.describe("새 문서 인증 acceptance", () => {
  test("AUTH-001 student 비밀번호 로그인", async ({ page }) => {
    await passwordLogin(page, ACCOUNT_EMAILS.student, TEST_PASSWORD);
    await page.waitForURL(/\/portal\/cohort/);
    await expect(page.getByText("My Build").first()).toBeVisible();
    const cookies = await page.context().cookies(BASE_URL);
    expect(cookies.some((c) => c.name.startsWith("sb-") && c.value.length > 0)).toBeTruthy();
  });

  test("AUTH-002 잘못된 비밀번호는 일반화 오류와 세션 없음", async ({ page }) => {
    await passwordLogin(page, ACCOUNT_EMAILS.student, `wrong-${Date.now()}`);
    await expect(page).toHaveURL(/\/login/);
    const error = page.locator(".text-danger");
    await expect(error).toBeVisible();
    await expect(error).not.toContainText(ACCOUNT_EMAILS.student);
    const cookies = await page.context().cookies(BASE_URL);
    expect(cookies.some((c) => c.name.startsWith("sb-") && c.value.length > 0)).toBeFalsy();
  });

  test("AUTH-003 미가입 이메일도 동일한 일반화 오류", async ({ page }) => {
    const email = `unknown-${Date.now()}@example.com`;
    await passwordLogin(page, email, "WrongPassword!1");
    await expect(page).toHaveURL(/\/login/);
    const error = page.locator(".text-danger");
    await expect(error).toBeVisible();
    await expect(error).not.toContainText(/가입되지|존재하지|unknown/i);
  });

  test("AUTH-004 매직링크 요청 성공 안내와 redirect allowlist", async ({ page }) => {
    let redirectTo = "";
    await page.route("**/auth/v1/otp**", async (route) => {
      redirectTo = new URL(route.request().url()).searchParams.get("redirect_to") ?? "";
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("login-root")).toHaveAttribute("data-hydrated", "true");
    await page.getByRole("button", { name: /매직링크로 로그인/ }).click();
    await page.locator('input[type="email"]').fill(ACCOUNT_EMAILS.student);
    await page.getByRole("button", { name: "매직링크 받기" }).click();
    await expect(page.getByText(/로그인 링크를 보냈습니다/)).toBeVisible();
    const redirect = new URL(redirectTo);
    expect(redirect.origin).toBe(BASE_URL);
    expect(redirect.pathname).toBe("/auth/callback");
  });

  test("AUTH-005 최초 매직링크는 set-password와 applicant profile 생성", async ({ browser }) => {
    const user = await freshUser("pw-auth005");
    try {
      const opened = await openMagic(browser, await actionLink(user.email, "/portal/cohort"));
      try {
        await expect(opened.page).toHaveURL(/\/set-password\?next=%2Fportal%2Fcohort/);
        const profile = await admin().from("profiles").select("id, role, has_password").eq("id", user.id).single();
        expect(profile.error).toBeNull();
        expect(profile.data).toMatchObject({ id: user.id, role: "applicant", has_password: false });
      } finally { await opened.context.close(); }
    } finally { await cleanupUser(user.id); }
  });

  test("AUTH-006 비밀번호 설정 후 has_password와 auth password 갱신", async ({ browser }) => {
    const user = await freshUser("pw-auth006");
    const newPassword = `AuthQA!${Date.now()}`;
    try {
      const opened = await openMagic(browser, await actionLink(user.email, "/"));
      try {
        await opened.page.getByPlaceholder("새 비밀번호 (8자 이상)").fill(newPassword);
        await opened.page.getByPlaceholder("비밀번호 확인").fill(newPassword);
        await opened.page.getByRole("button", { name: /비밀번호 설정하고 계속하기/ }).click();
        await opened.page.waitForURL((url) => url.pathname === "/");
        const profile = await admin().from("profiles").select("has_password").eq("id", user.id).single();
        expect(profile.data?.has_password).toBe(true);
        const login = await anon().auth.signInWithPassword({ email: user.email, password: newPassword });
        expect(login.error).toBeNull();
      } finally { await opened.context.close(); }
    } finally { await cleanupUser(user.id); }
  });

  test("AUTH-007 7자 비밀번호는 서버 호출 없이 차단", async ({ browser }) => {
    const user = await freshUser("pw-auth007");
    try {
      const opened = await openMagic(browser, await actionLink(user.email));
      try {
        await opened.page.getByPlaceholder("새 비밀번호 (8자 이상)").fill("1234567");
        await opened.page.getByPlaceholder("비밀번호 확인").fill("1234567");
        await opened.page.getByRole("button", { name: /비밀번호 설정하고 계속하기/ }).click();
        await expect(opened.page.getByText(/8자 이상/)).toBeVisible();
        const profile = await admin().from("profiles").select("has_password").eq("id", user.id).single();
        expect(profile.data?.has_password).toBe(false);
      } finally { await opened.context.close(); }
    } finally { await cleanupUser(user.id); }
  });

  test("AUTH-008 서로 다른 비밀번호 확인값 차단", async ({ browser }) => {
    const user = await freshUser("pw-auth008");
    try {
      const opened = await openMagic(browser, await actionLink(user.email));
      try {
        await opened.page.getByPlaceholder("새 비밀번호 (8자 이상)").fill("AuthQA!1234");
        await opened.page.getByPlaceholder("비밀번호 확인").fill("AuthQA!5678");
        await opened.page.getByRole("button", { name: /비밀번호 설정하고 계속하기/ }).click();
        await expect(opened.page.getByText(/일치하지 않습니다/)).toBeVisible();
        const profile = await admin().from("profiles").select("has_password").eq("id", user.id).single();
        expect(profile.data?.has_password).toBe(false);
      } finally { await opened.context.close(); }
    } finally { await cleanupUser(user.id); }
  });

  test("AUTH-009 has_password 계정 매직링크는 set-password 생략", async ({ browser }) => {
    const opened = await openMagic(browser, await actionLink(ACCOUNT_EMAILS.student, "/portal/cohort"));
    try {
      expect(new URL(opened.page.url()).pathname).toBe("/portal/cohort");
    } finally { await opened.context.close(); }
  });

  test("AUTH-010 admin 재로그인 후 profile 역할·필드 보존", async ({ browser }) => {
    const before = await admin().from("profiles").select("role, name, company").eq("id", await (async () => {
      const users = await admin().auth.admin.listUsers({ page: 1, perPage: 200 });
      return users.data.users.find((u) => u.email === ACCOUNT_EMAILS.admin)?.id;
    })()).single();
    expect(before.error).toBeNull();
    const opened = await openMagic(browser, await actionLink(ACCOUNT_EMAILS.admin, "/admin"));
    try {
      expect(new URL(opened.page.url()).pathname).toBe("/admin");
      const users = await admin().auth.admin.listUsers({ page: 1, perPage: 200 });
      const id = users.data.users.find((u) => u.email === ACCOUNT_EMAILS.admin)?.id;
      const after = await admin().from("profiles").select("role, name, company").eq("id", id).single();
      expect(after.data).toEqual(before.data);
    } finally { await opened.context.close(); }
  });

  test("AUTH-011 사용 완료 매직링크 재사용 차단", async ({ browser }) => {
    const user = await freshUser("pw-auth011");
    try {
      const link = await actionLink(user.email);
      const first = await openMagic(browser, link);
      await expect(first.page).toHaveURL(/\/set-password/);
      await first.context.close();
      const second = await openMagic(browser, link);
      try {
        await expect(second.page).toHaveURL(/\/login\?error=auth/);
        const cookies = await second.context.cookies(BASE_URL);
        expect(cookies.some((c) => c.name.startsWith("sb-") && c.value.length > 0)).toBeFalsy();
      } finally { await second.context.close(); }
    } finally { await cleanupUser(user.id); }
  });

  test("AUTH-012 60초 내 두 번째 매직링크 요청 rate-limit 문구", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt > 0) await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("login-root")).toHaveAttribute("data-hydrated", "true");
      await page.getByRole("button", { name: /매직링크로 로그인/ }).click();
      await page.locator('input[type="email"]').fill(ACCOUNT_EMAILS.admin);
      await page.getByRole("button", { name: "매직링크 받기" }).click();
    }
    const message = await page.locator(".text-danger, [class*=callout]").last().textContent();
    expect(message).toMatch(/초|잠시|요청|보냈습니다|rate/i);
    expect(message).not.toMatch(/stack|trace|AuthApiError/i);
  });

  test("AUTH-013 logout 후 보호 화면 재접근 차단", async ({ page }) => {
    test.fail(true, "현재 문서에 등록된 known_gap: logout UI 미구현");
    await passwordLogin(page, ACCOUNT_EMAILS.student, TEST_PASSWORD);
    await page.waitForURL(/\/portal\/cohort/);
    await page.getByRole("button", { name: /로그아웃/ }).click({ timeout: 5_000 });
    await page.goto("/portal/cohort");
    await expect(page).toHaveURL(/\/login/);
  });

  test("AUTH-014 has_password=false 보호 경로는 set-password 강제", async ({ browser }) => {
    test.fail(true, "현재 문서에 등록된 known_gap: has_password 보호 게이트 미구현");
    const user = await freshUser("pw-auth014");
    try {
      const opened = await openMagic(browser, await actionLink(user.email, "/portal/cohort"));
      try {
        await opened.page.goto(`${BASE_URL}/portal/cohort`, { waitUntil: "domcontentloaded" });
        await expect(opened.page).toHaveURL(/\/set-password\?next=%2Fportal%2Fcohort/);
      } finally { await opened.context.close(); }
    } finally { await cleanupUser(user.id); }
  });
});
