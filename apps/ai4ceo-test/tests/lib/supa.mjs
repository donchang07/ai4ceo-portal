// 비브라우저 테스트(API/RLS/RAG/서버액션 DB 단언)용 Supabase 헬퍼.
// service role 클라이언트(시드/티어다운)와 계정별 access_token 취득/토큰바운드 클라이언트를 제공한다.
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import path from "node:path";

// Playwright(CJS 변환) 에서 import.meta 사용 불가 → cwd 기준으로 .env.local 로드.
// Playwright/노드 스크립트 모두 앱 루트(apps/ai4ceo-test)에서 실행된다.
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const TEST_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD || "uscdon00";
export const BASE_URL = process.env.TEST_BASE_URL || "https://ai4ceo-portal.vercel.app";

export const ACCOUNT_EMAILS = {
  admin: "donchang0725@gmail.com",
  student: "donchang@hanmail.net",
  alumniMember: "donchang0725@naver.com",
  alumniNoMember: "donchang@kaist.ac.kr",
  applicant: "donchang0725@kakao.com",
};

export function assertEnv() {
  const missing = [];
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) throw new Error(`환경변수 누락: ${missing.join(", ")}`);
}

// service role 클라이언트 — RLS 우회(시드/티어다운/프로비저닝 전용)
export function admin() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// 계정 로그인 → access_token 취득
const tokenCache = new Map();
export async function accessToken(accountKey) {
  if (tokenCache.has(accountKey)) return tokenCache.get(accountKey);
  const email = ACCOUNT_EMAILS[accountKey];
  if (!email) throw new Error(`알 수 없는 계정: ${accountKey}`);
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password: TEST_PASSWORD });
  if (error) throw new Error(`${accountKey} 로그인 실패: ${error.message}`);
  const token = data.session?.access_token;
  if (!token) throw new Error(`${accountKey} access_token 없음`);
  tokenCache.set(accountKey, token);
  return token;
}

// 특정 계정의 access_token 으로 RLS 적용된 PostgREST 클라이언트 생성
export async function clientAs(accountKey) {
  const token = await accessToken(accountKey);
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// 익명(anon) 클라이언트
export function anon() {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// 계정의 auth user id 조회(service role) — 소유권 기반 데이터 시드/조회용
export async function userId(accountKey) {
  const email = ACCOUNT_EMAILS[accountKey];
  const sb = admin();
  // listUsers 페이지네이션 최소화: 이메일로 필터가 없으므로 첫 페이지에서 탐색(계정 소수)
  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(`listUsers 실패: ${error.message}`);
  const u = data.users.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());
  return u?.id ?? null;
}
