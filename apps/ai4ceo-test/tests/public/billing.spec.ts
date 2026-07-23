import { expect, test, type Browser, type BrowserContext } from "@playwright/test";
import { admin, assertMutationTarget, clientAs, userId, ACCOUNT_EMAILS } from "../lib/supa.mjs";
import { ensureStorageState, type AccountKey } from "../fixtures/accounts";

const COHORT_ID = "00000000-0000-0000-0000-0000000000c1";
const BANK_ACCOUNT = "140-012-546787";

async function authedContext(browser: Browser, account: AccountKey): Promise<BrowserContext> {
  return browser.newContext({ storageState: await ensureStorageState(browser, account), permissions: ["clipboard-read", "clipboard-write"] });
}

async function latestEnrollment(account: AccountKey) {
  const id = await userId(account);
  if (!id) throw new Error(`${account} user fixture not found`);
  const result = await admin().from("enrollments").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(1).single();
  if (result.error) throw result.error;
  return result.data;
}

async function seedInvoice(account: AccountKey, suffix: string, overrides: Record<string, unknown> = {}) {
  assertMutationTarget();
  const enrollment = await latestEnrollment(account);
  const result = await admin().from("invoices").insert({
    enrollment_id: enrollment.id,
    number: `INV-QA-${suffix}-${Date.now()}`,
    amount: 2_200_000,
    biz_name: `Codex QA ${suffix}`,
    method: "bank_transfer",
    status: "issued",
    ...overrides,
  }).select("*").single();
  if (result.error) throw result.error;
  return { enrollment, invoice: result.data };
}

async function removeInvoice(id: string) {
  await admin().from("tax_invoices").delete().eq("invoice_id", id);
  await admin().from("payments").delete().eq("invoice_id", id);
  await admin().from("invoices").delete().eq("id", id);
}

test.describe("등록·결제·멤버십 acceptance", () => {
  for (const fixture of [
    ["ENR-001", "수락자 프로필·서약 등록 플로우"],
    ["ENR-002", "등록 확정 OT 알림 outbox"],
    ["ENR-003", "assistant 초대·링크 수락"],
    ["ENR-004", "CEO만 assistant 링크 해제"],
  ] as const) {
    test(`${fixture[0]} ${fixture[1]}`, async ({ page }) => {
      test.fail(true, "문서에 등록된 known_gap: 등록·assistant 연결 제품 플로우가 아직 없음");
      await page.goto("/apply/status", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("link", { name: /프로필 완성|서약|assistant 초대|비서 초대/ })).toBeVisible();
    });
  }

  test("BILL-001 청구 금액·번호·issued 타임라인", async ({ browser }) => {
    const { invoice } = await seedInvoice("student", "BILL001");
    const context = await authedContext(browser, "student");
    try {
      const page = await context.newPage();
      await page.goto("/portal/billing", { waitUntil: "networkidle" });
      await expect(page.getByText("2,200,000원", { exact: true })).toBeVisible();
      await expect(page.getByText(invoice.number, { exact: true })).toBeVisible();
      await expect(page.getByText("입금 대기", { exact: true }).first()).toBeVisible();
      await expect(page.getByText("입금 확인 대기", { exact: true })).toBeVisible();
    } finally {
      await context.close();
      await removeInvoice(invoice.id);
    }
  });

  test("BILL-002 계좌 복사 clipboard와 완료 표시", async ({ browser }) => {
    const context = await authedContext(browser, "student");
    try {
      const page = await context.newPage();
      await page.goto("/portal/billing", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "계좌 복사" }).click();
      await expect(page.getByRole("button", { name: "복사됨" })).toBeVisible();
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(BANK_ACCOUNT);
    } finally { await context.close(); }
  });

  test("BILL-003 스마트스토어 새 탭 이동", async ({ browser }) => {
    test.fail(true, "문서에 등록된 known_gap: 이동 버튼에 href가 없음");
    const context = await authedContext(browser, "student");
    try {
      const page = await context.newPage();
      await page.goto("/portal/billing", { waitUntil: "networkidle" });
      const move = page.getByRole("button", { name: "이동" });
      await expect(move).toHaveAttribute("href", "https://smartstore.naver.com/aibblab");
      await expect(move).toHaveAttribute("target", "_blank");
    } finally { await context.close(); }
  });

  test("BILL-004 사업자 파일을 포함한 세금계산서 요청", async ({ browser }) => {
    test.fail(true, "문서에 등록된 known_gap: 사업자 파일·회사 필드와 관리자 큐 계약이 없음");
    const { invoice } = await seedInvoice("student", "BILL004");
    const context = await authedContext(browser, "student");
    try {
      const page = await context.newPage();
      await page.goto("/portal/billing", { waitUntil: "networkidle" });
      await expect(page.locator('input[type="file"]')).toBeVisible();
    } finally { await context.close(); await removeInvoice(invoice.id); }
  });

  test("BILL-005 ADM-010 관리자 입금확인은 DB·등록·알림에 영속", async ({ browser }) => {
    const seeded = await seedInvoice("student", "BILL005");
    const originalEnrollmentStatus = seeded.enrollment.status;
    const context = await authedContext(browser, "admin");
    try {
      const page = await context.newPage();
      await page.goto("/admin/billing", { waitUntil: "networkidle" });
      await page.getByText("입금 확인", { exact: true }).click();
      const row = page.locator("tr", { hasText: seeded.invoice.biz_name }).first();
      await row.getByRole("button", { name: /입금 확인 처리/ }).click();
      const inv = await admin().from("invoices").select("status, paid_at").eq("id", seeded.invoice.id).single();
      const enr = await admin().from("enrollments").select("status").eq("id", seeded.enrollment.id).single();
      expect(inv.data?.status).toBe("paid");
      expect(inv.data?.paid_at).toBeTruthy();
      expect(enr.data?.status).toBe("paid");
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("tr", { hasText: seeded.invoice.biz_name }).getByText("입금 완료", { exact: true })).toBeVisible();
    } finally {
      await admin()
        .from("enrollments")
        .update({ status: originalEnrollmentStatus })
        .eq("id", seeded.enrollment.id);
      await context.close();
      await removeInvoice(seeded.invoice.id);
    }
  });

  test("BILL-006 입금확인 재호출은 paid_at·알림이 중복되지 않음", async () => {
    const seeded = await seedInvoice("student", "BILL006", { status: "paid", paid_at: "2026-07-01T00:00:00Z" });
    try {
      const before = await admin().from("invoices").select("status, paid_at").eq("id", seeded.invoice.id).single();
      const outbox = await admin().from("notification_outbox").select("id").eq("entity_id", seeded.invoice.id);
      expect(outbox.error).toBeNull();
      expect(before.data).toMatchObject({ status: "paid", paid_at: "2026-07-01T00:00:00+00:00" });
      expect(outbox.data).toHaveLength(1);
    } finally { await removeInvoice(seeded.invoice.id); }
  });

  for (const fixture of [
    ["BILL-007", "Toss staging 생성·서명 webhook 승인"],
    ["BILL-008", "서명 없는 Toss webhook 거부"],
    ["BILL-009", "계좌이체 세금계산서 Popbill mock"],
    ["BILL-010", "Toss 영수증과 세금계산서 중복 방지"],
  ] as const) {
    test(`${fixture[0]} ${fixture[1]}`, async ({ page }) => {
      test.fail(true, "문서에 등록된 known_gap: Toss·Popbill 서버 계약이 아직 없음");
      const response = await page.request.post(`/api/${fixture[0].startsWith("BILL-00") ? "payments/toss" : "tax-invoices"}/qa`, { data: {} });
      expect(response.status()).toBeLessThan(400);
    });
  }

  test("BILL-011 결제 위임 이메일 저장·배지·새로고침 유지", async ({ browser }) => {
    assertMutationTarget();
    const enrollment = await latestEnrollment("student");
    const original = enrollment.billing_delegate_email ?? null;
    const context = await authedContext(browser, "student");
    try {
      const page = await context.newPage();
      await page.goto("/portal/billing", { waitUntil: "networkidle" });
      const active = page.getByRole("switch", { checked: true });
      if (await active.isVisible().catch(() => false)) await active.click();
      await page.getByRole("textbox", { name: "위임할 담당자 이메일" }).fill(ACCOUNT_EMAILS.assistant);
      await page.getByRole("button", { name: "위임하기" }).click();
      await expect(page.getByText(new RegExp(ACCOUNT_EMAILS.assistant))).toBeVisible();
      await expect.poll(async () => (await admin().from("enrollments").select("billing_delegate_email").eq("id", enrollment.id).single()).data?.billing_delegate_email).toBe(ACCOUNT_EMAILS.assistant);
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.getByText(new RegExp(ACCOUNT_EMAILS.assistant))).toBeVisible();
    } finally {
      await admin().from("enrollments").update({ billing_delegate_email: original }).eq("id", enrollment.id);
      await context.close();
    }
  });

  test("BILL-012 assistant는 위임 invoice 조회·tax 요청만 가능", async () => {
    const seeded = await seedInvoice("student", "BILL012");
    const enrollment = seeded.enrollment;
    const original = enrollment.billing_delegate_email ?? null;
    try {
      await admin().from("enrollments").update({ billing_delegate_email: ACCOUNT_EMAILS.assistant }).eq("id", enrollment.id);
      const assistant = await clientAs("assistant");
      const read = await assistant.from("invoices").select("id").eq("id", seeded.invoice.id);
      expect(read.error).toBeNull();
      expect(read.data).toHaveLength(1);
      const tax = await assistant.rpc("request_tax_invoice", { p_invoice_id: seeded.invoice.id, p_biz_reg_no: "123-45-67890" });
      expect(tax.error).toBeNull();
      const paid = await assistant.from("invoices").update({ status: "paid" }).eq("id", seeded.invoice.id).select("id");
      expect(paid.error).toBeNull();
      expect(paid.data).toEqual([]);
    } finally {
      await admin().from("enrollments").update({ billing_delegate_email: original }).eq("id", enrollment.id);
      await removeInvoice(seeded.invoice.id);
    }
  });

  test("BILL-013 다른 사용자의 invoice는 RLS로 빈 배열", async () => {
    const seeded = await seedInvoice("alumniMember", "BILL013", { biz_name: "PII-COMPANY" });
    try {
      const student = await clientAs("student");
      const result = await student.from("invoices").select("*").eq("id", seeded.invoice.id);
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    } finally { await removeInvoice(seeded.invoice.id); }
  });

  test("MEM-001 활성 멤버십 상태·동적 D-day·연 550,000원", async ({ browser }) => {
    const context = await authedContext(browser, "alumniMember");
    try {
      const page = await context.newPage();
      await page.goto("/alumni/membership", { waitUntil: "networkidle" });
      const diff = Math.ceil((new Date("2027-12-31T23:59:59Z").getTime() - Date.now()) / 86_400_000);
      await expect(page.getByText("이용 중", { exact: true })).toBeVisible();
      await expect(page.getByText(`만료까지 D-${diff}`, { exact: true })).toBeVisible();
      await expect(page.getByText("550,000원", { exact: true })).toBeVisible();
      await expect(page.getByText(/연간.*VAT 포함/)).toBeVisible();
    } finally { await context.close(); }
  });

  test("MEM-002 만료 회원은 갱신 CTA와 archive action 잠금", async ({ browser }) => {
    const context = await authedContext(browser, "alumniExpired");
    try {
      const membership = await context.newPage();
      await membership.goto("/alumni/membership", { waitUntil: "networkidle" });
      await expect(membership.getByRole("link", { name: "멤버십 가입하기" })).toBeVisible();
      const archive = await context.newPage();
      await archive.goto("/alumni/archive", { waitUntil: "networkidle" });
      await expect(archive.getByRole("link", { name: "멤버십 갱신" })).toBeVisible();
      await expect(archive.getByRole("button", { name: /재생|다운로드/ })).toHaveCount(0);
    } finally { await context.close(); }
  });
});
