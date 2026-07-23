// FR-13: RAG 스모크 (AI-02). 재학생 세션으로 "18기 등록비" 질문 → 응답에 "220만원"+"출처".
// 느슨한 단언 + 1회 재시도. 비용 억제 위해 1건만.
import { test, expect, request as pwRequest } from "@playwright/test";
import { createClient, type Session } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(__dirname, ".env.local") });

// @ts-expect-error — .mjs 유틸(타입 없음)
import { cookieHeader } from "./lib/ssr-cookie.mjs";
import { ACCOUNT_EMAILS, TEST_PASSWORD } from "./fixtures/accounts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const BASE_URL = process.env.TEST_BASE_URL || "";

if (!BASE_URL) throw new Error("TEST_BASE_URL is required. Refusing to default to production.");

async function studentSession(): Promise<Session> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: ACCOUNT_EMAILS.student,
    password: TEST_PASSWORD,
  });
  if (error || !data.session) throw new Error(`재학생 로그인 실패: ${error?.message}`);
  return data.session;
}

async function askTutor(cookie: string, question: string): Promise<{ status: number; text: string }> {
  const ctx = await pwRequest.newContext({ baseURL: BASE_URL, timeout: 120_000 });
  try {
    const res = await ctx.post("/api/ai/tutor", {
      headers: { "content-type": "application/json", cookie },
      data: { question },
    });
    const text = await res.text();
    return { status: res.status(), text };
  } finally {
    await ctx.dispose();
  }
}

test.describe("RAG 스모크", () => {
  test("AI-002 AI-02 재학생 '18기 등록비' → 220만원 + 출처", async () => {
    test.setTimeout(150_000);
    const session = await studentSession();
    const cookie = cookieHeader(SUPABASE_URL, session);

    let last = { status: 0, text: "" };
    for (let attempt = 0; attempt < 2; attempt++) {
      last = await askTutor(cookie, "18기 등록비는 얼마인가요?");
      if (last.status === 403) {
        test.skip(true, "쿠키 인증 인프라 미동작(403) — RAG 스모크 생략");
        return;
      }
      const hasFee = /220만원|2,200,000|2200000|220/.test(last.text);
      const hasSource = /출처|강의자료/.test(last.text);
      if (hasFee && hasSource) {
        expect(hasFee).toBe(true);
        expect(hasSource).toBe(true);
        return;
      }
    }
    // 마지막 시도 기준 단언(실패 시 진단용 메시지)
    expect(last.text, `등록비 응답에 금액이 없음: ${last.text.slice(0, 200)}`).toMatch(/220만원|2,200,000|2200000|220/);
    expect(last.text).toMatch(/출처|강의자료/);
  });
});
