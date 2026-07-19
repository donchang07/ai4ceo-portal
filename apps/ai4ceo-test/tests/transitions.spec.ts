// FR-2: 상태 전이 픽스처 (AC-32/33/34). service role 로 계정 상태를 setup 에서 변형하고
// afterEach/finally 에서 반드시 원복한다. 프로덕션 계정 상태가 절대 남지 않도록 try/finally 로 보장.
// (matrix.access.spec.ts 가 naver/hanmail 을 O 로 단언하므로, 이 스펙은 desktop/mobile 완료 후 실행
//  되도록 playwright.config 의 project dependencies 로 순서를 강제한다 — 매트릭스와 상태 경합 방지.)
import { test, expect, type BrowserContext } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(__dirname, ".env.local") });

// @ts-expect-error — .mjs 헬퍼(타입 없음)
import { admin, userId } from "./lib/supa.mjs";
import { ensureStorageState, type AccountKey } from "./fixtures/accounts";

// 계정 storageState 로 라우트 접근 후 최종 pathname 반환
async function landing(context: BrowserContext, routePath: string): Promise<string> {
  const page = await context.newPage();
  try {
    await page.goto(routePath, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    return new URL(page.url()).pathname;
  } finally {
    await page.close();
  }
}

test.describe.serial("상태 전이 · setup 변형 → 접근 → 원복", () => {
  const svc = admin();

  test("AC-32 멤버십 expired → /portal/sessions 접근 회수(/alumni/membership) → 원복", async ({ browser }) => {
    const uid = await userId("alumniMember");
    const { data: mem } = await svc
      .from("memberships")
      .select("id, status")
      .eq("user_id", uid)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    test.skip(!mem?.id, "naver active 멤버십 없음");
    const original = mem!.status as string;

    const state = await ensureStorageState(browser, "alumniMember");
    const context = await browser.newContext({ storageState: state });
    try {
      await svc.from("memberships").update({ status: "expired" }).eq("id", mem!.id);
      const pathname = await landing(context, "/portal/sessions");
      expect(pathname, "만료 멤버십 → 세션 접근 자동 회수").toBe("/alumni/membership");
    } finally {
      await svc.from("memberships").update({ status: original }).eq("id", mem!.id);
      await context.close();
    }

    // 원복 확인
    const { data: restored } = await svc.from("memberships").select("status").eq("id", mem!.id).maybeSingle();
    expect(restored?.status, "AC-32 원복 실패").toBe(original);
  });

  test("AC-33 재학생 dropped → /portal/cohort 회수(/portal/billing) → 원복", async ({ browser }) => {
    const uid = await userId("student");
    const { data: en } = await svc
      .from("enrollments")
      .select("id, status")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    test.skip(!en?.id, "hanmail enrollment 없음");
    const original = en!.status as string;

    const state = await ensureStorageState(browser, "student");
    const context = await browser.newContext({ storageState: state });
    try {
      await svc.from("enrollments").update({ status: "dropped" }).eq("id", en!.id);
      const pathname = await landing(context, "/portal/cohort");
      expect(pathname, "중도이탈 시 LMS 회수").toBe("/portal/billing");
    } finally {
      await svc.from("enrollments").update({ status: original }).eq("id", en!.id);
      await context.close();
    }

    const { data: restored } = await svc.from("enrollments").select("status").eq("id", en!.id).maybeSingle();
    expect(restored?.status, "AC-33 원복 실패").toBe(original);
  });

  test("AC-34 재학생 completed → /alumni 접근 O + /portal/chat 회수 → 원복", async ({ browser }) => {
    const uid = await userId("student");
    const { data: en } = await svc
      .from("enrollments")
      .select("id, status")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    test.skip(!en?.id, "hanmail enrollment 없음");
    const original = en!.status as string;

    const state = await ensureStorageState(browser, "student");
    const context = await browser.newContext({ storageState: state });
    try {
      await svc.from("enrollments").update({ status: "completed" }).eq("id", en!.id);
      const alumniPath = await landing(context, "/alumni");
      expect(alumniPath, "수료 전환 시 졸업생 화면 접근 O").toBe("/alumni");
      const chatPath = await landing(context, "/portal/chat");
      expect(chatPath, "수료 전환 시 재학생 대화방 접근 회수(리다이렉트)").not.toBe("/portal/chat");
    } finally {
      await svc.from("enrollments").update({ status: original }).eq("id", en!.id);
      await context.close();
    }

    const { data: restored } = await svc.from("enrollments").select("status").eq("id", en!.id).maybeSingle();
    expect(restored?.status, "AC-34 원복 실패").toBe(original);
  });
});
