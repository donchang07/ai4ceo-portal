import { expect, test, type Page } from "@playwright/test";
import { admin, anon, assertMutationTarget } from "../lib/supa.mjs";

const VALID = {
  name: "Playwright 지원자",
  company: "AI4CEO QA",
  title: "대표",
  phone: "010-1234-5678",
  email: "",
  referral: "R17-KSH",
  motivation: "스테이징 지원서 전체 흐름을 검증합니다.",
};

function nav(page: Page) {
  const buttons = page.getByRole("button");
  return { previous: buttons.nth(0), next: buttons.nth(1) };
}

async function expectStep(page: Page, current: number) {
  await expect(page.getByText(`${current} / 7`, { exact: true })).toBeVisible();
}

async function fillCurrent(page: Page, value: string) {
  const control = page.locator("input, textarea").first();
  await expect(control).toBeVisible();
  await control.fill(value);
  return control;
}

async function completeApplication(page: Page, email: string) {
  const values = [
    VALID.name,
    VALID.company,
    VALID.title,
    VALID.phone,
    email,
    VALID.referral,
    VALID.motivation,
  ];
  for (let index = 0; index < values.length; index += 1) {
    await expectStep(page, index + 1);
    await fillCurrent(page, values[index]);
    await nav(page).next.click();
  }
}

test.describe("지원서 P0 acceptance", () => {
  test("APP-001 7단계 이동, 입력 유지, 선택 추천코드", async ({ page }) => {
    await page.goto("/apply", { waitUntil: "domcontentloaded" });
    await expectStep(page, 1);
    await expect(nav(page).previous).toBeDisabled();

    await fillCurrent(page, VALID.name);
    await nav(page).next.click();
    await expectStep(page, 2);

    await fillCurrent(page, VALID.company);
    await nav(page).previous.click();
    await expectStep(page, 1);
    await expect(page.locator("input")).toHaveValue(VALID.name);
    await nav(page).next.click();

    for (const value of [VALID.company, VALID.title, VALID.phone, "app001@example.com"]) {
      await fillCurrent(page, value);
      await nav(page).next.click();
    }

    await expectStep(page, 6);
    await expect(nav(page).next, "추천코드는 비워도 다음 단계로 갈 수 있어야 한다").toBeEnabled();
    await nav(page).next.click();
    await expectStep(page, 7);
    await fillCurrent(page, VALID.motivation);
    await expect(nav(page).next, "마지막 단계 제출 버튼이 보여야 한다").toBeVisible();
    await expect(nav(page).next).toBeEnabled();
  });

  test("APP-002 필수 필드 공백 입력 차단", async ({ page }) => {
    await page.goto("/apply", { waitUntil: "domcontentloaded" });
    const validValues = [VALID.name, VALID.company, VALID.title, VALID.phone, "app002@example.com"];

    for (const value of validValues) {
      await fillCurrent(page, "   ");
      await expect(nav(page).next, "공백만 입력하면 다음 버튼이 비활성화되어야 한다").toBeDisabled();
      await fillCurrent(page, value);
      await nav(page).next.click();
    }

    await expectStep(page, 6);
    await nav(page).next.click();
    await expectStep(page, 7);
    await fillCurrent(page, "   ");
    await expect(nav(page).next, "공백 동기는 제출할 수 없어야 한다").toBeDisabled();
  });

  test("APP-003 잘못된 전화·이메일 형식 차단", async ({ page }) => {
    test.fail(true, "현재 문서에 등록된 known_gap: 형식 validation이 아직 구현되지 않음");
    await page.goto("/apply", { waitUntil: "domcontentloaded" });

    for (const value of [VALID.name, VALID.company, VALID.title]) {
      await fillCurrent(page, value);
      await nav(page).next.click();
    }

    await fillCurrent(page, "123");
    await expect.soft(page.getByText(/올바른 전화번호|숫자 10자리/)).toBeVisible();
    await expect.soft(nav(page).next).toBeDisabled();
    if (await nav(page).next.isEnabled()) await nav(page).next.click();

    await fillCurrent(page, "not-an-email");
    await expect.soft(page.getByText(/올바른 이메일/)).toBeVisible();
    await expect.soft(nav(page).next).toBeDisabled();
  });

  test("APP-004 전체 제출 시 applications 행 1개 저장", async ({ page }) => {
    assertMutationTarget();
    const sb = admin();
    const email = `pw-app004-${Date.now()}@example.com`;

    try {
      await page.goto("/apply", { waitUntil: "domcontentloaded" });
      await completeApplication(page, email);

      let rows: Record<string, unknown>[] = [];
      await expect
        .poll(async () => {
          const result = await sb.from("applications").select("*").eq("email", email);
          if (result.error) throw result.error;
          rows = result.data ?? [];
          return rows.length;
        })
        .toBe(1);

      expect(rows[0]).toMatchObject({
        cohort_id: "00000000-0000-0000-0000-0000000000c1",
        name: VALID.name,
        company: VALID.company,
        title: VALID.title,
        phone: VALID.phone,
        email,
        motivation: VALID.motivation,
        referral_code: VALID.referral,
        status: "received",
      });
      expect(rows[0].created_at).toBeTruthy();
    } finally {
      await sb.from("applications").delete().eq("email", email);
    }
  });

  test("APP-005 제출 완료 화면과 접수번호", async ({ page }) => {
    assertMutationTarget();
    const sb = admin();
    const email = `pw-app005-${Date.now()}@example.com`;

    try {
      await page.goto("/apply", { waitUntil: "domcontentloaded" });
      await completeApplication(page, email);
      await expect.soft(page.getByRole("heading", { name: "지원이 접수되었습니다" })).toBeVisible();
      await expect.soft(page.getByText(/^AP-18-\d{4}$/)).toBeVisible();
      await expect.soft(page.getByText(/이메일|안내/).first()).toBeVisible();
    } finally {
      await sb.from("applications").delete().eq("email", email);
    }
  });

  test("APP-006 제출 알림 email·알림톡 outbox 각 1건", async () => {
    test.fail(true, "현재 문서에 등록된 known_gap: 알림 outbox/provider 미구현");
    assertMutationTarget();
    const result = await admin().from("notification_outbox").select("channel, recipient, template, receipt_no").limit(1);
    expect(result.error, "email·알림톡 outbox 테이블과 계약이 존재해야 한다").toBeNull();
    expect(result.data?.filter((row) => row.channel === "email")).toHaveLength(1);
    expect(result.data?.filter((row) => row.channel === "alimtalk")).toHaveLength(1);
  });

  test("APP-007 유효 추천코드 저장과 추천 seed 귀속", async ({ page }) => {
    assertMutationTarget();
    const sb = admin();
    const email = `pw-app007-${Date.now()}@example.com`;
    try {
      const referral = await sb.from("referrals").select("code, label").eq("code", VALID.referral).maybeSingle();
      expect(referral.error).toBeNull();
      expect(referral.data?.code).toBe(VALID.referral);
      await page.goto("/apply", { waitUntil: "domcontentloaded" });
      await completeApplication(page, email);
      await expect.poll(async () => {
        const inserted = await sb.from("applications").select("referral_code").eq("email", email).maybeSingle();
        if (inserted.error) throw inserted.error;
        return inserted.data?.referral_code ?? null;
      }).toBe(VALID.referral);
    } finally {
      await sb.from("applications").delete().eq("email", email);
    }
  });

  test("APP-008 잘못된 추천코드 차단 또는 null 저장", async ({ page }) => {
    test.fail(true, "현재 문서에 등록된 known_gap: 추천코드 유효성 정책 미구현");
    assertMutationTarget();
    const sb = admin();
    const email = `pw-app008-${Date.now()}@example.com`;
    try {
      await page.goto("/apply", { waitUntil: "domcontentloaded" });
      const invalid = `INVALID-${Date.now()}`;
      const values = [VALID.name, VALID.company, VALID.title, VALID.phone, email, invalid, VALID.motivation];
      for (const value of values) {
        await fillCurrent(page, value);
        await nav(page).next.click();
      }
      await expect(page.getByText(/^AP-18-\d{4}$/)).toBeVisible();
      await expect.poll(async () => {
        const inserted = await sb.from("applications").select("referral_code").eq("email", email).maybeSingle();
        if (inserted.error) throw inserted.error;
        return { found: Boolean(inserted.data), referral: inserted.data?.referral_code ?? null };
      }).toEqual({ found: true, referral: null });
    } finally {
      await sb.from("applications").delete().eq("email", email);
    }
  });

  for (const fixture of [
    { id: "APP-009", status: "received", label: "접수 완료" },
    { id: "APP-010", status: "reviewing", label: "심사 중" },
    { id: "APP-011", status: "accepted", label: "합격" },
  ]) {
    test(`${fixture.id} 지원 상태 ${fixture.label} 조회`, async ({ page }) => {
      assertMutationTarget();
      const sb = admin();
      const email = `pw-${fixture.id.toLowerCase()}-${Date.now()}@example.com`;
      const phone = "010-9876-5432";
      try {
        const seeded = await sb.from("applications").insert({
          cohort_id: "00000000-0000-0000-0000-0000000000c1",
          name: "상태조회 지원자",
          company: "AI4CEO QA",
          title: "대표",
          phone,
          email,
          motivation: "상태 조회 테스트",
          status: fixture.status,
        }).select("id").single();
        expect(seeded.error).toBeNull();

        await page.goto("/apply/status", { waitUntil: "domcontentloaded" });
        await page.getByLabel("이메일").fill(email);
        await page.getByLabel("전화번호").fill(phone);
        await page.getByRole("button", { name: /상태 조회/ }).click();
        await expect(page.getByText(fixture.label, { exact: true })).toBeVisible();
        await expect(page.getByText("18기", { exact: true })).toBeVisible();
        await expect(page.getByText(/접수일:/)).toBeVisible();
        const activeSteps = page.locator("span.bg-primary").filter({ hasText: /^[123]$/ });
        expect(await activeSteps.count()).toBe(fixture.status === "received" ? 1 : fixture.status === "reviewing" ? 2 : 3);
      } finally {
        await sb.from("applications").delete().eq("email", email);
      }
    });
  }

  test("APP-012 일치하지 않는 이메일에는 내역 없음", async ({ page }) => {
    await page.goto("/apply/status", { waitUntil: "domcontentloaded" });
    await page.getByLabel("이메일").fill(`unknown-${Date.now()}@example.com`);
    await page.getByLabel("전화번호").fill("010-9876-5432");
    await page.getByRole("button", { name: /상태 조회/ }).click();
    await expect(page.getByText(/일치하는 지원 내역이 없습니다/)).toBeVisible();
    await expect(page.getByText(/접수일:/)).toHaveCount(0);
  });

  test("APP-013 잘못된 상태조회 입력은 RPC 호출 없이 차단", async ({ page }) => {
    let rpcCalls = 0;
    page.on("request", (request) => {
      if (request.url().includes("/rpc/lookup_application_status")) rpcCalls += 1;
    });
    await page.goto("/apply/status", { waitUntil: "domcontentloaded" });
    await page.getByLabel("이메일").fill("not-an-email");
    await page.getByLabel("전화번호").fill("123456789");
    await page.getByRole("button", { name: /상태 조회/ }).click();
    await expect(page.getByText(/올바른 이메일|전화번호를 숫자 10자리 이상/)).toBeVisible();
    expect(rpcCalls).toBe(0);
  });

  test("APP-014 이메일·전화 교차 조합은 빈 결과와 최소 필드만 반환", async () => {
    assertMutationTarget();
    const sb = admin();
    const stamp = Date.now();
    const a = { email: `pw-app014-a-${stamp}@example.com`, phone: "010-1111-2222" };
    const b = { email: `pw-app014-b-${stamp}@example.com`, phone: "010-3333-4444" };
    try {
      const seeded = await sb.from("applications").insert([a, b].map((x) => ({
        ...x,
        cohort_id: "00000000-0000-0000-0000-0000000000c1",
        name: "교차조회 지원자",
        company: "AI4CEO QA",
        title: "대표",
        motivation: "교차 조회 방어",
        status: "received",
      })));
      expect(seeded.error).toBeNull();
      const result = await anon().rpc("lookup_application_status", { p_email: a.email, p_phone: b.phone });
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
      const fields = Object.keys(result.data?.[0] ?? {});
      for (const pii of ["name", "email", "phone", "motivation"]) expect(fields).not.toContain(pii);
    } finally {
      await sb.from("applications").delete().in("email", [a.email, b.email]);
    }
  });
});
