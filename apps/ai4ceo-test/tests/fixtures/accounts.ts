// FR-1/FR-5: 계정별 Playwright 로그인(storageState) 헬퍼 + supabase access_token 헬퍼.
import { type Browser, type Page } from "@playwright/test";
import { createClient, type Session } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
// @ts-expect-error — .mjs 유틸(타입 없음)
import { buildAuthCookies } from "../lib/ssr-cookie.mjs";

export type AccountKey =
  | "admin"
  | "student"
  | "alumniMember"
  | "alumniNoMember"
  | "applicant";

export const ACCOUNT_EMAILS: Record<AccountKey, string> = {
  admin: "donchang0725@gmail.com",
  student: "donchang@hanmail.net",
  alumniMember: "donchang0725@naver.com",
  alumniNoMember: "donchang@kaist.ac.kr",
  applicant: "donchang0725@kakao.com",
};

export const TEST_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD || "uscdon00";
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const BASE_URL = process.env.TEST_BASE_URL || "https://ai4ceo-portal.vercel.app";

const AUTH_DIR = path.resolve(process.cwd(), "tests/.auth");

// 계정 세션 취득(supabase-js 로그인)
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

// 계정별 storageState 파일 확보. UI 로그인 대신 @supabase/ssr 쿠키를 직접 주입(결정적·빠름).
// (동일 쿠키 인코딩을 api.authz/rag.smoke 가 사용해 프로덕션에서 인증됨을 검증한다.)
export async function ensureStorageState(browser: Browser, account: AccountKey): Promise<string> {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const file = path.join(AUTH_DIR, `${account}.json`);
  const session = await sessionFor(account);
  const cookies = (buildAuthCookies(SUPABASE_URL, session) as { name: string; value: string }[]).map((c) => ({
    name: c.name,
    value: c.value,
    url: BASE_URL,
    httpOnly: false,
    secure: BASE_URL.startsWith("https"),
    sameSite: "Lax" as const,
  }));
  const context = await browser.newContext();
  await context.addCookies(cookies);
  await context.storageState({ path: file });
  await context.close();
  return file;
}

// supabase access_token 취득(비브라우저 API/RLS 테스트에서 사용).
export async function accessToken(account: AccountKey): Promise<string> {
  const session = await sessionFor(account);
  return session.access_token;
}

// (deprecated) UI 로그인 — 참고용. 프로덕션 로그인 폼이 필요할 때만.
export async function loginViaUI(page: Page, account: AccountKey): Promise<void> {
  const email = ACCOUNT_EMAILS[account];
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 }).catch(() => {});
}
