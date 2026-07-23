"use client";

import { useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Badge, Callout, Chip, Input } from "@/components/ui";
import type { Application } from "@/lib/db/types";
import { cn } from "@/lib/core/cn";
import { updateApplicationStatus } from "./actions";

type Status = Application["status"];

const STATUS_LABEL: Record<Status, string> = {
  received: "접수",
  reviewing: "검토",
  accepted: "합격",
  waitlist: "대기",
  rejected: "불합격",
};

const STATUS_TONE: Record<Status, "neutral" | "progress" | "done" | "wait" | "danger"> = {
  received: "neutral",
  reviewing: "progress",
  accepted: "done",
  waitlist: "wait",
  rejected: "danger",
};

const FILTERS: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "received", label: "접수" },
  { key: "reviewing", label: "검토" },
  { key: "accepted", label: "합격" },
  { key: "waitlist", label: "대기" },
  { key: "rejected", label: "불합격" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function ApplicationsTable({ applications }: { applications: Application[] }) {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setStatus(id: string, status: Status) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await updateApplicationStatus(id, status);
      if (!result.ok) setError(result.message);
      setPendingId(null);
    });
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: applications.length };
    for (const a of applications) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [applications]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.company.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q)
      );
    });
  }, [applications, filter, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
              <span className="tnum text-xs opacity-70">{counts[f.key] ?? 0}</span>
            </Chip>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <Input
            className="pl-9"
            placeholder="이름·회사·직함 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[15px] border border-hairline bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-hairline bg-surface-muted text-left text-xs font-semibold text-muted">
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3">이름 · 직함</th>
                <th className="px-4 py-3">회사</th>
                <th className="px-4 py-3">동기</th>
                <th className="px-4 py-3">추천 경로</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">지원일</th>
                <th className="px-4 py-3 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rows.map((a) => (
                <tr key={a.id} className={cn("hover:bg-surface-muted/50", selected.has(a.id) && "bg-info-surface")}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#2c5ce6]"
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                      aria-label={`${a.name} 선택`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{a.name}</div>
                    <div className="text-xs text-muted">{a.title}</div>
                  </td>
                  <td className="px-4 py-3 text-ink">{a.company}</td>
                  <td className="max-w-[260px] px-4 py-3">
                    <span className="block truncate text-muted">{a.motivation}</span>
                  </td>
                  <td className="px-4 py-3">
                    {a.referral_label ? (
                      <Badge tone="info" className="bg-info-surface">
                        {a.referral_label}
                      </Badge>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 tnum text-muted">{formatDate(a.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {a.status === "received" && (
                        <button
                          disabled={isPending && pendingId === a.id}
                          onClick={() => setStatus(a.id, "reviewing")}
                          className="rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-info-surface disabled:opacity-50"
                        >
                          검토
                        </button>
                      )}
                      {a.status !== "accepted" && (
                        <button
                          disabled={isPending && pendingId === a.id}
                          onClick={() => setStatus(a.id, "accepted")}
                          className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
                        >
                          합격
                        </button>
                      )}
                      <button
                        disabled={isPending && pendingId === a.id}
                        onClick={() => setStatus(a.id, "waitlist")}
                        className="rounded-full border border-hairline px-3 py-1 text-xs font-semibold text-ink hover:bg-surface-muted disabled:opacity-50"
                      >
                        대기
                      </button>
                      <button
                        aria-label="지원 거절"
                        disabled={isPending && pendingId === a.id}
                        onClick={() => setStatus(a.id, "rejected")}
                        className="rounded-full border border-hairline px-3 py-1 text-xs font-semibold text-danger hover:bg-surface-muted disabled:opacity-50"
                      >
                        불합격
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted">
                    조건에 맞는 지원자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger">
          상태 변경 실패: {error}
        </div>
      )}
      <Callout className="mt-4">
        합격으로 변경 시 알림톡 T-02와 초대 링크, 인보이스가 자동 발송됩니다.
      </Callout>
    </div>
  );
}
