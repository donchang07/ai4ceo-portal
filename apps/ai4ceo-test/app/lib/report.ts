import fs from "node:fs";
import path from "node:path";

// generate.mjs 가 쓰는 리포트 스키마 (대시보드 입력 계약)
export type Declared = "pass" | "mock" | "unknown";
export type ResultKind = "pass" | "fail" | "skip" | "manual";
export type Verdict = "ok" | "regression" | "newpass" | "xfail" | "verified" | "manual";

export interface CaseRow {
  id: string;
  file: string;
  section: string;
  priority: string;
  declared: Declared;
  result: ResultKind;
  verdict: Verdict;
  durationMs: number;
  error: string | null;
}

export interface MatrixCell {
  expect: string;
  actual: "ok" | "fail" | "unknown";
  ok: boolean;
}

export interface Report {
  runAt: string;
  commit: string;
  env: string;
  baseUrl: string;
  summary: {
    total: number;
    automated: number;
    passed: number;
    failed: number;
    regressions: number;
    newlyPassing: number;
    xfail: number;
    manual: number;
    verified: number;
  };
  cases: CaseRow[];
  matrix: {
    rows: string[];
    cols: string[];
    cells: Record<string, MatrixCell>;
  };
}

// tests/report/latest.json 을 읽는다. 없으면 null.
export function loadReport(): Report | null {
  const candidates = [
    path.join(process.cwd(), "tests", "report", "latest.json"),
    path.join(process.cwd(), "apps", "ai4ceo-test", "tests", "report", "latest.json"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, "utf8")) as Report;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

// 역할/라우트 라벨
export const ROLE_LABELS: Record<string, string> = {
  admin: "admin",
  student: "재학생",
  alumniMember: "졸업+멤버십",
  alumniNoMember: "졸업 미가입",
  applicant: "관심자",
  guest: "비로그인",
};
