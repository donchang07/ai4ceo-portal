// FR-16~19: 리포트 생성기. Playwright json 결과 + 비브라우저(gate-lint) 결과를 병합,
// 문서 선언상태 vs 실제결과를 PRD 4.2 규칙으로 대조·분류.
// 출력: tests/report/latest.json + report-<ISO>.md + latest.md, docs/class/test-cases/reports/ 로 복사.
// 🔴 회귀(P0 보안·돈)가 1건이라도 있으면 exit 1.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { parseAllCases } from "./parse-cases.mjs";
import { AUTOMATED, MANUAL, extractCaseIds } from "../registry.mjs";
import { MATRIX, ROUTES, ROUTE_ORDER, ROLE_ORDER, ACCOUNTS } from "../lib/matrix.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS = path.resolve(__dirname, "results.json");
const GATE = path.resolve(__dirname, "gate-lint.json");
const REPORT_DIR = __dirname; // tests/report
const DOCS_REPORTS = path.resolve(__dirname, "../../../../docs/class/test-cases/reports");

const STATUS_RANK = { fail: 3, pass: 2, skip: 1 };
function worse(a, b) {
  if (!a) return b;
  if (!b) return a;
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b;
}

// --- Playwright results.json 파싱 ---
function collectSpecs(node, acc = []) {
  if (!node) return acc;
  if (Array.isArray(node.suites)) node.suites.forEach((s) => collectSpecs(s, acc));
  if (Array.isArray(node.specs)) {
    for (const spec of node.specs) {
      const statuses = [];
      let duration = 0;
      let error = null;
      for (const t of spec.tests ?? []) {
        for (const r of t.results ?? []) {
          const s = r.status === "passed" ? "pass" : r.status === "skipped" ? "skip" : "fail";
          statuses.push(s);
          duration = Math.max(duration, r.duration ?? 0);
          if (s === "fail" && !error) {
            error = (r.error?.message ?? r.errors?.[0]?.message ?? "실패").split("\n")[0].slice(0, 300);
          }
        }
        if ((t.results ?? []).length === 0) statuses.push("skip");
      }
      const status = statuses.reduce((a, s) => worse(a, s), null) ?? "skip";
      acc.push({ title: spec.title, status, duration, error });
    }
  }
  return acc;
}

function loadPlaywright() {
  if (!fs.existsSync(RESULTS)) return [];
  try {
    const json = JSON.parse(fs.readFileSync(RESULTS, "utf8"));
    return collectSpecs(json);
  } catch (e) {
    console.warn("[generate] results.json 파싱 실패:", e.message);
    return [];
  }
}

function loadGate() {
  if (!fs.existsSync(GATE)) return null;
  try {
    return JSON.parse(fs.readFileSync(GATE, "utf8"));
  } catch {
    return null;
  }
}

function gitCommit() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { cwd: __dirname }).toString().trim();
  } catch {
    return "unknown";
  }
}

// --- 실제 결과 집계 (caseId → {result, durationMs, error}) ---
function buildResults(specs, gate) {
  const byId = {};
  const put = (id, status, duration, error) => {
    const prev = byId[id];
    const merged = worse(prev?.result, status);
    byId[id] = {
      result: merged,
      durationMs: Math.max(prev?.durationMs ?? 0, duration ?? 0),
      error: status === "fail" ? error ?? prev?.error ?? null : prev?.error ?? null,
    };
  };
  for (const spec of specs) {
    const ids = extractCaseIds(spec.title);
    for (const id of ids) put(id, spec.status, spec.duration, spec.error);
  }
  // gate-lint 결과 중 doc 케이스 ID(SEC-11 등) 병합
  if (gate?.results) {
    for (const r of gate.results) {
      if (r.id) put(r.id, r.result === "pass" ? "pass" : "fail", 0, r.result === "fail" ? r.detail : null);
    }
  }
  return byId;
}

// --- 판정 (PRD 4.2) ---
function verdictOf(declared, result) {
  if (result === "manual" || result === "skip") return "manual";
  if (result === "pass") {
    if (declared === "pass") return "ok";
    if (declared === "mock") return "newpass";
    return "verified"; // unknown 확정
  }
  // fail
  if (declared === "pass") return "regression";
  if (declared === "mock") return "xfail";
  return "verified"; // unknown 확정(실패로 확정)
}

// --- 매트릭스 히트맵 ---
function buildMatrix(specs) {
  // 셀 상태: `${role}|${routeKey}` → status
  const cellStatus = {};
  const accountKeys = Object.keys(ACCOUNTS);
  for (const spec of specs) {
    const tokens = spec.title.split(/\s+/);
    const role = tokens.find((t) => accountKeys.includes(t));
    const routeKey = tokens.find((t) => ROUTE_ORDER.includes(t));
    if (!role || !routeKey) continue;
    const key = `${role}|${routeKey}`;
    cellStatus[key] = worse(cellStatus[key], spec.status);
  }
  const cols = ROUTE_ORDER.map((k) => ROUTES[k]);
  const cells = {};
  for (const role of ROLE_ORDER) {
    for (const routeKey of ROUTE_ORDER) {
      const expect = MATRIX[role][routeKey];
      const status = cellStatus[`${role}|${routeKey}`];
      const actual = status === "pass" ? "ok" : status === "fail" ? "fail" : "unknown";
      cells[`${role}|${ROUTES[routeKey]}`] = {
        expect,
        actual,
        ok: status === "pass",
      };
    }
  }
  return { rows: [...ROLE_ORDER], cols, cells };
}

function main() {
  const docCases = parseAllCases();
  const specs = loadPlaywright();
  const gate = loadGate();
  const resById = buildResults(specs, gate);

  const cases = docCases.map((c) => {
    const r = resById[c.id];
    let result;
    if (r) result = r.result;
    else if (AUTOMATED[c.id]) result = "skip"; // 자동화 대상이나 이번 실행에서 미수집
    else result = "manual";
    const verdict = verdictOf(c.declaredStatus, result);
    return {
      id: c.id,
      file: c.file,
      section: c.section,
      priority: c.priority,
      declared: c.declaredStatus,
      result,
      verdict,
      durationMs: r?.durationMs ?? 0,
      error: r?.error ?? null,
    };
  });

  const count = (fn) => cases.filter(fn).length;
  const summary = {
    total: cases.length,
    automated: count((c) => c.result === "pass" || c.result === "fail"),
    passed: count((c) => c.verdict === "ok"),
    failed: count((c) => c.result === "fail"),
    regressions: count((c) => c.verdict === "regression"),
    newlyPassing: count((c) => c.verdict === "newpass"),
    xfail: count((c) => c.verdict === "xfail"),
    manual: count((c) => c.verdict === "manual"),
    verified: count((c) => c.verdict === "verified"),
  };

  const report = {
    runAt: new Date().toISOString(),
    commit: gitCommit(),
    env: process.env.TEST_ENV || "production",
    baseUrl: process.env.TEST_BASE_URL || "https://ai4ceo-portal.vercel.app",
    summary,
    cases,
    matrix: buildMatrix(specs),
  };

  // 출력
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.mkdirSync(DOCS_REPORTS, { recursive: true });
  const iso = report.runAt.replace(/[:.]/g, "-");
  const md = renderMarkdown(report, gate);

  fs.writeFileSync(path.join(REPORT_DIR, "latest.json"), JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(path.join(REPORT_DIR, "latest.md"), md, "utf8");
  fs.writeFileSync(path.join(DOCS_REPORTS, `report-${iso}.json`), JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(path.join(DOCS_REPORTS, `report-${iso}.md`), md, "utf8");
  fs.writeFileSync(path.join(DOCS_REPORTS, "latest.json"), JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(path.join(DOCS_REPORTS, "latest.md"), md, "utf8");

  // 콘솔 요약
  console.log(`[generate] 리포트 생성 완료 (commit ${report.commit}, env ${report.env})`);
  console.log(`  전체 ${summary.total} · 자동실행 ${summary.automated} · ✅통과 ${summary.passed} · 🔴회귀 ${summary.regressions} · 🟢신규통과 ${summary.newlyPassing} · ⚪xfail ${summary.xfail} · 🟡검증 ${summary.verified} · manual ${summary.manual}`);

  const regressions = cases.filter((c) => c.verdict === "regression");
  if (regressions.length > 0) {
    console.error("[generate] 🔴 회귀(배포 차단):");
    for (const c of regressions) {
      const p0 = /P0/.test(c.priority) ? " [P0]" : "";
      console.error(`  🔴 ${c.id}${p0} (${c.file}) — ${c.error ?? "실패"}`);
    }
    process.exit(1);
  }
  if (summary.newlyPassing > 0) {
    console.log("[generate] 🟢 신규 통과 → 문서 상태 갱신 필요:");
    for (const c of cases.filter((x) => x.verdict === "newpass")) console.log(`  🟢 ${c.id} (${c.file}) — 문서 ⚠ → 실제 통과`);
  }
}

function badge(verdict) {
  return {
    ok: "✅",
    regression: "🔴",
    newpass: "🟢",
    xfail: "⚪",
    verified: "🟡",
    manual: "⚪",
  }[verdict] ?? "·";
}

function renderMarkdown(report, gate) {
  const s = report.summary;
  const L = [];
  L.push(`# 테스트 리포트 — ${report.runAt}`);
  L.push("");
  L.push(`대상 커밋: ${report.commit} · 환경: ${report.env} · baseUrl: ${report.baseUrl}`);
  L.push("");
  L.push("## 요약");
  L.push("| 구분 | 수 |");
  L.push("|---|---:|");
  L.push(`| 전체 케이스(문서) | ${s.total} |`);
  L.push(`| 자동화 실행 | ${s.automated} |`);
  L.push(`| ✅ 정상 통과 | ${s.passed} |`);
  L.push(`| 🔴 회귀(문서 ✅ ↔ 실패) | ${s.regressions} |`);
  L.push(`| 🟢 신규 통과(문서 ⚠ ↔ 통과) | ${s.newlyPassing} |`);
  L.push(`| ⚪ 예상 미구현(xfail) | ${s.xfail} |`);
  L.push(`| 🟡 미검증→검증됨 | ${s.verified} |`);
  L.push(`| ⚪ 미자동화/미실행(manual) | ${s.manual} |`);
  L.push("");

  if (gate) {
    L.push("## 정적 게이트 린트");
    for (const r of gate.results) L.push(`- ${r.result === "pass" ? "✅" : "🔴"} ${r.check} — ${r.detail}`);
    L.push("");
  }

  const regressions = report.cases.filter((c) => c.verdict === "regression");
  L.push(`## 🔴 회귀 (배포 차단) — ${regressions.length === 0 ? "없음" : `${regressions.length}건`}`);
  for (const c of regressions) L.push(`- ${c.id} (${c.file}, ${c.priority}) — ${c.error ?? "실패"}`);
  L.push("");

  const newpass = report.cases.filter((c) => c.verdict === "newpass");
  if (newpass.length) {
    L.push("## 🟢 신규 통과 → 문서 상태 갱신 필요");
    for (const c of newpass) L.push(`- ${c.id} (${c.file}) : 문서 ⚠ → 실제 통과. 상태 갱신 검토.`);
    L.push("");
  }

  L.push("## 케이스별 결과");
  L.push("| ID | 파일 | 우선순위 | 선언 | 실제 | 판정 |");
  L.push("|---|---|---|---|---|---|");
  const declaredSym = { pass: "✅", mock: "⚠", unknown: "❓" };
  for (const c of report.cases) {
    L.push(`| ${c.id} | ${c.file} | ${c.priority} | ${declaredSym[c.declared] ?? c.declared} | ${c.result} | ${badge(c.verdict)} |`);
  }
  L.push("");
  return L.join("\n");
}

main();
