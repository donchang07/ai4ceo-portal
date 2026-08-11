"use client";

import { useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Badge, Callout, Chip, Input, Textarea, Button } from "@/components/ui";
import type { Inquiry } from "@/lib/db/types";
import { ADMIN_EMAIL } from "@/lib/core/constants";
import { saveInquiryNote, updateInquiryStatus } from "./actions";

type Status = Inquiry["status"];

const STATUS_LABEL: Record<Status, string> = {
  new: "신규",
  in_progress: "처리중",
  done: "완료",
};

const STATUS_TONE: Record<Status, "neutral" | "progress" | "done"> = {
  new: "neutral",
  in_progress: "progress",
  done: "done",
};

const FILTERS: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "new", label: "신규" },
  { key: "in_progress", label: "처리중" },
  { key: "done", label: "완료" },
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function InquiriesTable({ inquiries }: { inquiries: Inquiry[] }) {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: inquiries.length };
    for (const i of inquiries) c[i.status] = (c[i.status] ?? 0) + 1;
    return c;
  }, [inquiries]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inquiries.filter((i) => {
      if (filter !== "all" && i.status !== filter) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        (i.email ?? "").toLowerCase().includes(q) ||
        (i.phone ?? "").includes(q) ||
        i.message.toLowerCase().includes(q)
      );
    });
  }, [inquiries, filter, query]);

  function setStatus(id: string, status: Status) {
    setError(null);
    startTransition(async () => {
      const res = await updateInquiryStatus(id, status);
      if (!res.ok) setError(res.message);
    });
  }

  function saveNote(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await saveInquiryNote(id, notes[id] ?? "");
      if (!res.ok) setError(res.message);
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
            placeholder="이름·연락처·내용 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((i) => {
          const open = openId === i.id;
          return (
            <div key={i.id} className="rounded-[15px] border border-hairline bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{i.name}</span>
                    <Badge tone={STATUS_TONE[i.status]}>{STATUS_LABEL[i.status]}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-faint">
                    {formatDateTime(i.created_at)}
                    {i.source && ` · ${i.source}`}
                  </div>
                  <div className="mt-1 text-[13px] text-muted">
                    {i.email ?? "-"} · {i.phone ?? "-"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["new", "in_progress", "done"] as Status[]).map((s) => (
                    <Chip key={s} active={i.status === s} onClick={() => setStatus(i.id, s)}>
                      {STATUS_LABEL[s]}
                    </Chip>
                  ))}
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">{i.message}</p>

              <button
                type="button"
                className="mt-3 text-[13px] font-medium text-primary"
                onClick={() => setOpenId(open ? null : i.id)}
              >
                {open ? "메모 닫기" : i.admin_note ? "처리 메모 보기" : "처리 메모 추가"}
              </button>

              {open && (
                <div className="mt-3">
                  <Textarea
                    className="min-h-24"
                    placeholder="처리 내용을 기록하세요."
                    value={notes[i.id] ?? i.admin_note ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [i.id]: e.target.value }))}
                  />
                  <Button variant="secondary" className="mt-2" onClick={() => saveNote(i.id)}>
                    메모 저장
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="rounded-[15px] border border-hairline bg-surface px-4 py-10 text-center text-muted">
            조건에 맞는 문의가 없습니다.
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger">
          처리 실패: {error}
        </div>
      )}

      <Callout className="mt-4">
        문의가 접수되면 관리자 이메일({ADMIN_EMAIL})로도 즉시 전달됩니다.
      </Callout>
    </div>
  );
}
