// PRD v3 acceptance case parser. docs/class/test-cases/0[1-8]-*.md 의
// 11-column tables를 읽어 report generator가 사용하는 필드와 상세 명세를 추출한다.
// 단독 실행 시 tests/report/cases.json 저장. generate.mjs 는 parseAllCases() 를 import.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = process.env.TEST_CASES_DOCS_DIR
  ? path.resolve(process.env.TEST_CASES_DOCS_DIR)
  : path.resolve(__dirname, "../../../../docs/class/test-cases");
const OUT = path.resolve(__dirname, "cases.json");

function statusFromGate(gate) {
  if (gate === "must_pass") return "pass";
  if (gate === "known_gap") return "mock";
  return "unknown";
}

function priorityFromText(text) {
  const m = text.match(/P([012])/);
  return m ? `P${m[1]}` : null;
}

// "AC-01~13" / "AC-01~AC-13" → ["AC-01",...,"AC-13"]. 단일 ID 면 [id].
function expandIds(cell) {
  const raw = cell.trim().replace(/\*\*/g, "");
  const rangeMatch = raw.match(/^([A-Z]{2,5}-[A-Z]{0,4})(\d{1,3})\s*[~–-]\s*(?:[A-Z]{2,5}-[A-Z]{0,4})?(\d{1,3})$/);
  if (rangeMatch) {
    const [, prefix, startStr, endStr] = rangeMatch;
    const pad = startStr.length;
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    if (end >= start && end - start < 100) {
      const ids = [];
      for (let n = start; n <= end; n++) ids.push(`${prefix}${String(n).padStart(pad, "0")}`);
      return ids;
    }
  }
  const single = raw.match(/^([A-Z]{2,5}-[A-Z]{0,4}\d{1,3})/);
  return single ? [single[1]] : [];
}

function parseFile(filePath) {
  const fileLabel = path.basename(filePath).slice(0, 2); // "01".."08"
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const cases = [];
  let section = "";
  let header = null;

  for (const line of lines) {
    const heading = line.match(/^#{2,3}\s+(.*)/);
    if (heading) {
      section = heading[1].trim();
      continue;
    }
    if (!line.trim().startsWith("|")) {
      header = null;
      continue;
    }
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length === 0) continue;
    // 구분선 행
    if (cells.every((c) => /^:?-{2,}:?$/.test(c) || c === "")) continue;
    // 헤더 행 감지
    if (header === null) {
      const idIdx = cells.findIndex((c) => c === "ID" || c.toUpperCase() === "ID");
      if (idIdx !== -1) {
        const indexOf = (name) => cells.findIndex((c) => c.toLowerCase() === name.toLowerCase());
        header = {
          idIdx,
          prdIdx: indexOf("PRD"),
          priorityIdx: indexOf("Pri"),
          layerIdx: indexOf("Layer"),
          preconditionsIdx: indexOf("Preconditions"),
          testDataIdx: indexOf("Test data"),
          stepsIdx: indexOf("Steps"),
          assertionsIdx: indexOf("Assertions"),
          forbiddenIdx: indexOf("Forbidden"),
          cleanupIdx: indexOf("Cleanup"),
          gateIdx: indexOf("Gate"),
        };
        continue;
      }
      // ID 헤더 없는 표(매트릭스 등)는 건너뜀
      continue;
    }
    // 데이터 행
    const idCell = cells[header.idIdx] ?? "";
    const ids = expandIds(idCell);
    if (ids.length === 0) continue;
    const get = (idx) => (idx >= 0 ? cells[idx] ?? "" : "");
    const prd = get(header.prdIdx);
    const steps = get(header.stepsIdx);
    const assertions = get(header.assertionsIdx);
    const gate = get(header.gateIdx);
    const scenario = `${prd} · ${steps}`;
    const priority = priorityFromText(get(header.priorityIdx)) ?? "P1";
    const declaredStatus = statusFromGate(gate);
    for (const id of ids) {
      cases.push({
        id,
        file: fileLabel,
        section,
        priority,
        declaredStatus,
        scenario,
        prd,
        layer: get(header.layerIdx),
        preconditions: get(header.preconditionsIdx),
        testData: get(header.testDataIdx),
        steps,
        assertions,
        forbidden: get(header.forbiddenIdx),
        cleanup: get(header.cleanupIdx),
        gate,
      });
    }
  }
  return cases;
}

export function parseAllCases() {
  const files = fs
    .readdirSync(DOCS_DIR)
    .filter((f) => /^0[1-8]-.*\.md$/.test(f))
    .sort()
    .map((f) => path.join(DOCS_DIR, f));
  const all = [];
  const seen = new Set();
  for (const file of files) {
    for (const c of parseFile(file)) {
      if (seen.has(c.id)) continue; // 중복 ID(문서 내 재언급) 방지 — 최초 정의 우선
      seen.add(c.id);
      all.push(c);
    }
  }
  return all;
}

// 단독 실행
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("parse-cases.mjs")) {
  const cases = parseAllCases();
  fs.writeFileSync(OUT, JSON.stringify(cases, null, 2), "utf8");
  const byFile = {};
  for (const c of cases) byFile[c.file] = (byFile[c.file] ?? 0) + 1;
  console.log(`[parse-cases] ${cases.length}개 케이스 파싱 → ${path.relative(process.cwd(), OUT)}`);
  console.log("[parse-cases] 파일별:", JSON.stringify(byFile));
}
