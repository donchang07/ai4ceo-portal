import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.resolve(__dirname, ".env.local") });

const BASE_URL = process.env.TEST_BASE_URL;
const BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

if (!BASE_URL) {
  throw new Error("TEST_BASE_URL is required. Refusing to default to production.");
}

// json reporter → tests/report/results.json (리포트 생성기 입력)
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 2,
  retries: 0,
  timeout: 60_000,
  reporter: [
    ["list"],
    ["json", { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME || "tests/report/results.json" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    extraHTTPHeaders: BYPASS_SECRET
      ? {
          "x-vercel-protection-bypass": BYPASS_SECRET,
          "x-vercel-set-bypass-cookie": "true",
        }
      : undefined,
  },
  projects: [
    {
      name: "public",
      testMatch: ["public/**/*.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    // 비브라우저 프로젝트: API 계약 / RLS / RAG / 서버액션 DB 단언 — 브라우저 불필요.
    // chromium 설치 실패 환경에서도 `npm run test:api` 로 실행 가능.
    {
      name: "api",
      testMatch: [
        "api.authz.spec.ts",
        "rls.security.spec.ts",
        "rag.smoke.spec.ts",
        "actions.lms.spec.ts",
      ],
      use: {},
    },
    // 브라우저 프로젝트: 접근 매트릭스 E2E (데스크톱)
    {
      name: "desktop",
      testMatch: ["matrix.access.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    // 모바일 뷰포트(AC-40/41 탭 노출)
    {
      name: "mobile",
      testMatch: ["matrix.access.spec.ts"],
      use: { ...devices["Pixel 5"] },
    },
    // 상태 전이(FR-2, AC-32/33/34): naver/hanmail 상태를 변형·원복한다. 매트릭스가 동일 계정을 O 로
    // 단언하므로 desktop/mobile 완료 후에만 실행되도록 dependencies 로 순서를 강제(상태 경합 방지).
    {
      name: "transitions",
      testMatch: ["transitions.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["desktop", "mobile"],
    },
  ],
});
