// FR-11/12 + FR-8(SEC-11): 정적 게이트 린트.
// - app/portal/**/page.tsx, app/alumni/**/page.tsx 가 require*Access 를 호출하는지(순수 redirect 스텁 예외).
// - app/api/**/route.ts 보호 대상이 권한 검사 코드를 포함하는지.
// - SERVICE_ROLE 키가 클라이언트('use client') 코드에 노출되지 않는지(SEC-11).
// 위반 시 non-zero exit. 결과를 tests/report/gate-lint.json 으로 남겨 리포트 생성기가 병합.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, "../../../ai4ceo/app");
const AI4CEO_ROOT = path.resolve(__dirname, "../../../ai4ceo");
const OUT = path.resolve(__dirname, "../report/gate-lint.json");

const GUARD_RE = /require(Lms|Archive|Billing|Alumni)Access/;
const REDIRECT_RE = /\bredirect\(/;
const API_AUTH_RE = /(getCurrentUser|auth\.getUser|isAdmin|canAccess\w+|status:\s*403|next=\/login)/;

function walk(dir, filter, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, filter, acc);
    } else if (filter(full)) {
      acc.push(full);
    }
  }
  return acc;
}

function rel(p) {
  return path.relative(AI4CEO_ROOT, p).replace(/\\/g, "/");
}

const violations = [];
const results = [];

// --- FR-11: portal/alumni 페이지 게이트 ---
const guardedRoots = [path.join(APP_DIR, "portal"), path.join(APP_DIR, "alumni")];
let portalPages = 0;
for (const root of guardedRoots) {
  for (const file of walk(root, (f) => f.endsWith("page.tsx"))) {
    portalPages++;
    const src = fs.readFileSync(file, "utf8");
    const hasGuard = GUARD_RE.test(src);
    const isRedirectStub = REDIRECT_RE.test(src) && !/from\s+["']@\/lib\/db\/queries/.test(src);
    if (!hasGuard && !isRedirectStub) {
      violations.push({ rule: "FR-11", file: rel(file), message: "require*Access 호출 없음(게이트 누락)" });
    }
  }
}
results.push({
  check: "FR-11 portal/alumni 게이트",
  result: violations.some((v) => v.rule === "FR-11") ? "fail" : "pass",
  detail: `${portalPages}개 페이지 검사`,
});

// --- FR-11: app/admin/** 는 admin layout(게이트) 하위인지 검사 ---
// admin 페이지는 개별 require*Access 대신 app/admin/layout.tsx 의 role=admin 게이트를 상속한다.
// 규칙: (1) app/admin/layout.tsx 존재 + 게이트 코드(auth.getUser + isAdmin + redirect) 포함,
//       (2) admin 하위에 layout 을 우회하는 route group((...)) 없음(모든 admin page 가 게이트 상속).
const ADMIN_DIR = path.join(APP_DIR, "admin");
const ADMIN_LAYOUT = path.join(ADMIN_DIR, "layout.tsx");
let adminPages = 0;
let adminLayoutOk = false;
if (fs.existsSync(ADMIN_DIR)) {
  adminPages = walk(ADMIN_DIR, (f) => f.endsWith("page.tsx")).length;
  if (!fs.existsSync(ADMIN_LAYOUT)) {
    violations.push({ rule: "FR-11", file: rel(ADMIN_DIR), message: "app/admin/layout.tsx 없음(admin 게이트 상속 불가)" });
  } else {
    const layoutSrc = fs.readFileSync(ADMIN_LAYOUT, "utf8");
    const hasAuth = /auth\.getUser|getCurrentUser/.test(layoutSrc);
    const hasAdminCheck = /isAdmin|role/.test(layoutSrc);
    const hasRedirect = REDIRECT_RE.test(layoutSrc);
    adminLayoutOk = hasAuth && hasAdminCheck && hasRedirect;
    if (!adminLayoutOk) {
      violations.push({ rule: "FR-11", file: rel(ADMIN_LAYOUT), message: "admin layout 게이트 미흡(auth.getUser+isAdmin+redirect 필요)" });
    }
    // admin 하위에 자체 layout 을 둔 route group 이 게이트를 덮어쓰지 않는지(직속 layout 외 추가 layout 경고)
    for (const lf of walk(ADMIN_DIR, (f) => f.endsWith("layout.tsx"))) {
      if (lf === ADMIN_LAYOUT) continue;
      const sub = fs.readFileSync(lf, "utf8");
      if (!/auth\.getUser|getCurrentUser|isAdmin/.test(sub)) {
        violations.push({ rule: "FR-11", file: rel(lf), message: "admin 하위 layout 이 게이트 없이 root admin layout 을 대체할 수 있음" });
      }
    }
  }
}
results.push({
  check: "FR-11 admin layout 게이트 상속",
  result: violations.some((v) => v.rule === "FR-11" && v.file.includes("admin")) ? "fail" : "pass",
  detail: `admin 페이지 ${adminPages}개 · layout ${adminLayoutOk ? "게이트 확인" : fs.existsSync(ADMIN_LAYOUT) ? "게이트 미흡" : "없음"}`,
});

// --- FR-12: api route 권한 검사 ---
const apiDir = path.join(APP_DIR, "api");
let apiRoutes = 0;
for (const file of walk(apiDir, (f) => f.endsWith("route.ts"))) {
  apiRoutes++;
  const src = fs.readFileSync(file, "utf8");
  if (!API_AUTH_RE.test(src)) {
    violations.push({ rule: "FR-12", file: rel(file), message: "권한 검사 코드 없음(보호 미흡)" });
  }
}
results.push({
  check: "FR-12 api route 권한 검사",
  result: violations.some((v) => v.rule === "FR-12") ? "fail" : "pass",
  detail: `${apiRoutes}개 route 검사`,
});

// --- FR-8 / SEC-11: service_role 키가 클라이언트 코드에 노출되지 않는지 ---
const scanRoots = [APP_DIR, path.join(AI4CEO_ROOT, "components"), path.join(AI4CEO_ROOT, "lib")];
let sec11Violation = false;
for (const root of scanRoots) {
  for (const file of walk(root, (f) => f.endsWith(".tsx") || f.endsWith(".ts"))) {
    const src = fs.readFileSync(file, "utf8");
    const isClient = /^\s*["']use client["']/m.test(src);
    if (isClient && /SERVICE_ROLE/.test(src)) {
      sec11Violation = true;
      violations.push({ rule: "SEC-11", file: rel(file), message: "'use client' 파일에서 SERVICE_ROLE 참조" });
    }
  }
}
results.push({
  id: "SEC-11",
  check: "SEC-11 service_role 키 클라이언트 미노출",
  result: sec11Violation ? "fail" : "pass",
  detail: sec11Violation ? "클라이언트 코드에서 SERVICE_ROLE 참조 발견" : "클라이언트 번들 노출 없음",
});

const ok = violations.length === 0;
const report = {
  ok,
  runAt: new Date().toISOString(),
  portalPagesChecked: portalPages,
  apiRoutesChecked: apiRoutes,
  results,
  violations,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 2), "utf8");

console.log(`[gate-lint] portal/alumni 페이지 ${portalPages}개, api route ${apiRoutes}개 검사`);
for (const r of results) console.log(`  ${r.result === "pass" ? "✅" : "🔴"} ${r.check} — ${r.detail}`);
if (!ok) {
  console.error("[gate-lint] 위반 발견:");
  for (const v of violations) console.error(`  🔴 [${v.rule}] ${v.file} — ${v.message}`);
  process.exit(1);
}
console.log("[gate-lint] 통과");
