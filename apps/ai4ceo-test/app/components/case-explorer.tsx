"use client";

import { useMemo, useState } from "react";
import { cn } from "@/app/lib/cn";
import type { CaseRow, Verdict } from "@/app/lib/report";
import { VerdictBadge, declaredSymbol, ResultText } from "./badges";

const FILES = ["01", "02", "03", "04", "05", "06", "07", "08"];
const PRIORITIES = ["P0", "P1", "P2"];
const VERDICTS: { key: Verdict; label: string }[] = [
  { key: "ok", label: "통과" },
  { key: "regression", label: "회귀" },
  { key: "newpass", label: "신규통과" },
  { key: "xfail", label: "xfail" },
  { key: "verified", label: "검증됨" },
  { key: "manual", label: "미자동화" },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)] text-white"
          : "border-border bg-surface text-muted hover:bg-surface-muted",
      )}
    >
      {children}
    </button>
  );
}

export function CaseExplorer({ cases }: { cases: CaseRow[] }) {
  const [file, setFile] = useState<string | null>(null);
  const [priority, setPriority] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return cases.filter((c) => {
      if (file && c.file !== file) return false;
      if (priority && !c.priority.includes(priority)) return false;
      if (verdict && c.verdict !== verdict) return false;
      if (query && !(`${c.id} ${c.section} ${c.priority}`.toLowerCase().includes(query))) return false;
      return true;
    });
  }, [cases, file, priority, verdict, q]);

  return (
    <section className="rounded-card border border-hairline bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-ink">케이스 목록</h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ID·시나리오 검색"
          className="w-56 rounded-control border border-border bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:border-[color:var(--color-primary)]"
        />
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        <span className="mr-1 text-xs font-semibold text-faint">파일</span>
        <Chip active={file === null} onClick={() => setFile(null)}>전체</Chip>
        {FILES.map((f) => (
          <Chip key={f} active={file === f} onClick={() => setFile(file === f ? null : f)}>{f}</Chip>
        ))}
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        <span className="mr-1 text-xs font-semibold text-faint">우선순위</span>
        <Chip active={priority === null} onClick={() => setPriority(null)}>전체</Chip>
        {PRIORITIES.map((p) => (
          <Chip key={p} active={priority === p} onClick={() => setPriority(priority === p ? null : p)}>{p}</Chip>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <span className="mr-1 text-xs font-semibold text-faint">판정</span>
        <Chip active={verdict === null} onClick={() => setVerdict(null)}>전체</Chip>
        {VERDICTS.map((v) => (
          <Chip key={v.key} active={verdict === v.key} onClick={() => setVerdict(verdict === v.key ? null : v.key)}>{v.label}</Chip>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs text-faint">
              <th className="py-2 pr-3 font-semibold">ID</th>
              <th className="py-2 pr-3 font-semibold">시나리오</th>
              <th className="py-2 pr-3 font-semibold">파일</th>
              <th className="py-2 pr-3 font-semibold">우선순위</th>
              <th className="py-2 pr-3 font-semibold">선언</th>
              <th className="py-2 pr-3 font-semibold">실제</th>
              <th className="py-2 pr-3 font-semibold">판정</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-hairline/60 hover:bg-surface-muted/50">
                <td className="py-2 pr-3">
                  <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-ink">{c.id}</span>
                </td>
                <td className="max-w-[360px] py-2 pr-3 text-muted">
                  <span className="line-clamp-1" title={c.section}>{c.section || "—"}</span>
                </td>
                <td className="py-2 pr-3 tnum text-muted">{c.file}</td>
                <td className="py-2 pr-3 text-muted">{c.priority}</td>
                <td className="py-2 pr-3">{declaredSymbol(c.declared)}</td>
                <td className="py-2 pr-3"><ResultText result={c.result} /></td>
                <td className="py-2 pr-3"><VerdictBadge verdict={c.verdict} /></td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-faint">조건에 맞는 케이스가 없습니다.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-faint tnum">{filtered.length} / {cases.length} 케이스</p>
    </section>
  );
}
