import { cn } from "@/app/lib/cn";
import type { Verdict, Declared, ResultKind } from "@/app/lib/report";

// 판정 배지: 중립 배경 + 컬러 점 (docs/DESIGN.md 관례)
const VERDICT_META: Record<Verdict, { label: string; dot: string; text: string }> = {
  ok: { label: "통과", dot: "bg-[color:var(--color-success)]", text: "text-[color:var(--color-success)]" },
  regression: { label: "회귀", dot: "bg-[color:var(--color-danger)]", text: "text-[color:var(--color-danger)]" },
  newpass: { label: "신규 통과", dot: "bg-[color:var(--color-primary)]", text: "text-[color:var(--color-primary)]" },
  xfail: { label: "예상 미구현", dot: "bg-[color:var(--color-faint)]", text: "text-muted" },
  verified: { label: "검증됨", dot: "bg-[color:var(--color-accent)]", text: "text-[color:var(--color-info)]" },
  manual: { label: "미자동화", dot: "bg-[color:var(--color-faint)]", text: "text-muted" },
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const m = VERDICT_META[verdict];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink">
      <span className={cn("dot", m.dot)} />
      <span className={m.text}>{m.label}</span>
    </span>
  );
}

const DECLARED_SYMBOL: Record<Declared, string> = { pass: "✅", mock: "⚠", unknown: "❓" };
export function declaredSymbol(d: Declared): string {
  return DECLARED_SYMBOL[d] ?? d;
}

export function ResultText({ result }: { result: ResultKind }) {
  const color =
    result === "pass"
      ? "text-[color:var(--color-success)]"
      : result === "fail"
        ? "text-[color:var(--color-danger)]"
        : "text-muted";
  return <span className={cn("tnum text-xs font-medium", color)}>{result}</span>;
}
