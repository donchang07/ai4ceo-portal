import { loadReport, ROLE_LABELS, type Report, type MatrixCell } from "@/app/lib/report";
import { CaseExplorer } from "@/app/components/case-explorer";
import { cn } from "@/app/lib/cn";

export const dynamic = "force-dynamic";

export default function Page() {
  const report = loadReport();
  if (!report) return <EmptyState />;
  return <Dashboard report={report} />;
}

function EmptyState() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <div className="rounded-card border border-hairline bg-surface p-10 text-center">
        <h1 className="text-xl font-bold text-ink">리포트가 아직 없습니다</h1>
        <p className="mt-3 text-sm text-muted">
          테스트를 실행해 리포트를 생성하세요. CLI가 먼저 돌고, 이 대시보드는 결과 JSON을 읽어 렌더합니다.
        </p>
        <pre className="mt-5 inline-block rounded-control bg-surface-muted px-4 py-3 text-left text-xs text-ink">
{`cd apps/ai4ceo-test
npm run test:all      # 프로비저닝 → 게이트린트 → E2E → 리포트
# 또는 개별:
npm run test:lint-gates
npm run test:api
npm run test:report`}
        </pre>
      </div>
    </main>
  );
}

function Dashboard({ report }: { report: Report }) {
  const s = report.summary;
  const danger = s.regressions > 0;
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">AI4CEO QA 대시보드</h1>
        <p className="mt-1 text-sm text-muted">비즈니스 테스트 자동화 리포트 (읽기 전용)</p>
      </header>

      {/* KPI 4장 */}
      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="전체 케이스" value={s.total} />
        <Kpi label="✅ 통과" value={s.passed} tone="success" />
        <Kpi label="🔴 회귀" value={s.regressions} tone={danger ? "danger" : "muted"} emphasize={danger} />
        <Kpi label="🟢 신규 통과" value={s.newlyPassing} tone="primary" />
      </section>

      {/* 실행 정보 */}
      <section className="mb-6 rounded-card border border-hairline bg-surface p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <Meta label="실행 시각" value={new Date(report.runAt).toLocaleString("ko-KR")} />
          <Meta label="커밋" value={report.commit} mono />
          <Meta label="환경" value={report.env} />
          <Meta label="baseUrl" value={report.baseUrl} mono />
          <Meta label="자동 실행" value={`${s.automated} / ${s.total}`} />
        </div>
      </section>

      {danger ? (
        <section className="mb-6 rounded-card border border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/5 p-4">
          <h2 className="text-sm font-bold text-[color:var(--color-danger)]">🔴 회귀 {s.regressions}건 — 배포 차단 대상</h2>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {report.cases.filter((c) => c.verdict === "regression").map((c) => (
              <li key={c.id}>
                <span className="font-mono text-xs font-semibold">{c.id}</span>{" "}
                <span className="text-muted">({c.file}, {c.priority})</span> — {c.error ?? "실패"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {s.newlyPassing > 0 ? (
        <section className="mb-6 rounded-card border border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/5 p-4">
          <h2 className="text-sm font-bold text-[color:var(--color-primary)]">🟢 신규 통과 {s.newlyPassing}건 — 문서 상태(⚠→✅) 갱신 대상</h2>
          <p className="mt-1 text-xs text-muted">
            {report.cases.filter((c) => c.verdict === "newpass").map((c) => c.id).join(", ")}
          </p>
        </section>
      ) : null}

      {/* 역할×라우트 히트맵 */}
      <Heatmap report={report} />

      {/* 우선순위별 진척 */}
      <PriorityProgress report={report} />

      {/* 케이스 목록 (클라이언트 필터) */}
      <CaseExplorer cases={report.cases} />
    </main>
  );
}

function Kpi({
  label,
  value,
  tone = "muted",
  emphasize = false,
}: {
  label: string;
  value: number;
  tone?: "success" | "danger" | "primary" | "muted";
  emphasize?: boolean;
}) {
  const toneClass = {
    success: "text-[color:var(--color-success)]",
    danger: "text-[color:var(--color-danger)]",
    primary: "text-[color:var(--color-primary)]",
    muted: "text-ink",
  }[tone];
  return (
    <div
      className={cn(
        "rounded-card border bg-surface p-5",
        emphasize ? "border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/5" : "border-hairline",
      )}
    >
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={cn("mt-1 text-3xl font-bold tnum", toneClass)}>{value}</div>
    </div>
  );
}

function Meta({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-faint">{label}</div>
      <div className={cn("text-sm text-ink", mono && "font-mono")}>{value}</div>
    </div>
  );
}

function cellClass(cell: MatrixCell | undefined): string {
  if (!cell) return "bg-surface-muted text-faint";
  if (cell.actual === "fail") return "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]";
  if (cell.actual === "unknown") return "bg-surface-muted text-faint";
  // ok
  if (cell.expect === "O") return "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]";
  return "bg-[color:var(--color-info-surface)] text-[color:var(--color-info)]"; // 정상 리다이렉트 = 중립 블루
}

function shortPath(p: string): string {
  return p.replace("/portal/", "p/").replace("/alumni/", "a/").replace("/alumni", "/a").replace("/portal", "/p");
}

function Heatmap({ report }: { report: Report }) {
  const { rows, cols, cells } = report.matrix;
  return (
    <section className="mb-6 rounded-card border border-hairline bg-surface p-5">
      <h2 className="mb-1 text-base font-bold text-ink">역할 × 라우트 접근 매트릭스</h2>
      <p className="mb-4 text-xs text-muted">셀 = 기대(expect) / 실제(actual). 녹=접근 허용, 파랑=정상 리다이렉트, 회색=미실행, 적=실패.</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-surface p-1.5 text-left font-semibold text-faint">역할 \ 라우트</th>
              {cols.map((c) => (
                <th key={c} className="p-1.5 text-center font-medium text-muted" title={c}>{shortPath(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((role) => (
              <tr key={role}>
                <td className="sticky left-0 whitespace-nowrap bg-surface p-1.5 font-medium text-ink">{ROLE_LABELS[role] ?? role}</td>
                {cols.map((path) => {
                  const cell = cells[`${role}|${path}`];
                  return (
                    <td key={path} className="p-0.5">
                      <div className={cn("rounded px-1 py-1 text-center leading-tight", cellClass(cell))} title={cell ? `expect ${cell.expect} / actual ${cell.actual}` : "no data"}>
                        <div className="font-semibold">{cell?.expect ?? "—"}</div>
                        <div className="text-[10px] opacity-70">{cell?.actual ?? "·"}</div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PriorityProgress({ report }: { report: Report }) {
  const priorities = ["P0", "P1", "P2"];
  return (
    <section className="mb-6 rounded-card border border-hairline bg-surface p-5">
      <h2 className="mb-4 text-base font-bold text-ink">우선순위별 진척</h2>
      <div className="space-y-4">
        {priorities.map((p) => {
          const rows = report.cases.filter((c) => c.priority.includes(p));
          const total = rows.length || 1;
          const passed = rows.filter((c) => ["ok", "verified", "newpass"].includes(c.verdict)).length;
          const regression = rows.filter((c) => c.verdict === "regression").length;
          const xfail = rows.filter((c) => c.verdict === "xfail").length;
          const manual = rows.filter((c) => c.verdict === "manual").length;
          const seg = (n: number) => `${(n / total) * 100}%`;
          return (
            <div key={p}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-ink">{p}</span>
                <span className="tnum text-muted">
                  통과 {passed} · 회귀 {regression} · xfail {xfail} · manual {manual} / {rows.length}
                </span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-muted">
                <div style={{ width: seg(passed) }} className="bg-[color:var(--color-success)]" />
                <div style={{ width: seg(regression) }} className="bg-[color:var(--color-danger)]" />
                <div style={{ width: seg(xfail) }} className="bg-[color:var(--color-faint)]" />
                <div style={{ width: seg(manual) }} className="bg-[color:var(--color-border)]" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
