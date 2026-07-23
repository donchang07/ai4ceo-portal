// FR-7: /api/ai/tutor 권한 (AI-01, LMS-AI04, SEC-10). 계정 access token으로 직접 호출.
// 빈 body 를 보내 인가 통과 시 400(질문 없음), 인가 실패 시 403 을 얻는다 → LLM 호출/비용 없음.
import { test, expect, request as pwRequest } from "@playwright/test";
import { createClient, type Session } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(__dirname, ".env.local") });

import { ACCOUNT_EMAILS, TEST_PASSWORD, type AccountKey } from "./fixtures/accounts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const BASE_URL = process.env.TEST_BASE_URL || "";

if (!BASE_URL) throw new Error("TEST_BASE_URL is required. Refusing to default to production.");

async function sessionFor(account: AccountKey): Promise<Session> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: ACCOUNT_EMAILS[account],
    password: TEST_PASSWORD,
  });
  if (error || !data.session) throw new Error(`${account} 로그인 실패: ${error?.message}`);
  return data.session;
}

async function tutorStatus(account: AccountKey | null): Promise<number> {
  const ctx = await pwRequest.newContext({ baseURL: BASE_URL });
  try {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (account) {
      const session = await sessionFor(account);
      headers["authorization"] = `Bearer ${session.access_token}`;
    }
    // 빈 body → 인가 통과 시 400(질문 없음), 실패 시 403
    const res = await ctx.post("/api/ai/tutor", { headers, data: {} });
    return res.status();
  } finally {
    await ctx.dispose();
  }
}

test.describe("API 인가 · /api/ai/tutor", () => {
  // 쿠키 인증 인프라 동작 확인용 참조 상태
  let studentStatus = 0;

  test("AI-001 AI-01 재학생 토큰 인가 통과(비403)", async () => {
    studentStatus = await tutorStatus("student");
    expect(studentStatus, "재학생은 인가 통과해야 함(400/200)").not.toBe(403);
  });

  test("AI-001 LMS-AI04 admin 인가 통과(비403)", async () => {
    test.skip(studentStatus === 403, "쿠키 인증 인프라 미동작(참조 계정 403) — 인가 세부 검증 생략");
    const s = await tutorStatus("admin");
    expect(s).not.toBe(403);
  });

  test("AI-001 SEC-008 SEC-10 졸업+멤버십 403", async () => {
    test.skip(studentStatus === 403, "쿠키 인증 인프라 미동작 — 생략");
    expect(await tutorStatus("alumniMember")).toBe(403);
  });

  test("AI-001 SEC-008 authz 졸업 미가입 403", async () => {
    test.skip(studentStatus === 403, "쿠키 인증 인프라 미동작 — 생략");
    expect(await tutorStatus("alumniNoMember")).toBe(403);
  });

  test("AI-001 SEC-008 authz 관심자 403", async () => {
    test.skip(studentStatus === 403, "쿠키 인증 인프라 미동작 — 생략");
    expect(await tutorStatus("applicant")).toBe(403);
  });

  test("AI-001 SEC-008 authz 비로그인 403", async () => {
    // 쿠키 없음 → 항상 403 (브라우저·인프라 무관하게 성립)
    expect(await tutorStatus(null)).toBe(403);
  });
});
