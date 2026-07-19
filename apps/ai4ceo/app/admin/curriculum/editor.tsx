"use client";

import { useState, useTransition } from "react";
import { Eye, GripVertical, RefreshCw, Save, X } from "lucide-react";
import { Badge, Button, Card, CardTitle, Input, Textarea } from "@/components/ui";
import type { Session } from "@/lib/db/types";
import { cn } from "@/lib/core/cn";
import { saveSession, reorderSessions } from "./actions";

function hour12(h: number): number {
  const r = h % 12;
  return r === 0 ? 12 : r;
}

function period(h: number): string {
  return h < 12 ? "오전" : "오후";
}

function dateTimeRange(s: Session): string {
  const start = new Date(s.starts_at);
  const end = new Date(s.ends_at);
  const sh = start.getHours();
  const eh = end.getHours();
  const sMin = start.getMinutes();
  const eMin = end.getMinutes();
  const sLabel = `${hour12(sh)}${sMin ? `:${String(sMin).padStart(2, "0")}` : ""}시`;
  const eLabel = `${hour12(eh)}${eMin ? `:${String(eMin).padStart(2, "0")}` : ""}시`;
  const range =
    period(sh) === period(eh) ? `${period(sh)}${sLabel}-${eLabel}` : `${period(sh)}${sLabel}-${period(eh)}${eLabel}`;
  return `${start.getMonth() + 1}월${start.getDate()}일 ${range}`;
}

function weekLabel(s: Session): string {
  return s.week_no > 0 ? `${s.week_no}주차 (${dateTimeRange(s)})` : `보충(${dateTimeRange(s)})`;
}

function subtitleOf(s: Session): string {
  const d = new Date(s.starts_at);
  const time = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return s.track ? `${time} · ${s.track}` : time;
}

export function CurriculumEditor({ sessions }: { sessions: Session[] }) {
  const first = sessions[0];
  const [localSessions, setLocalSessions] = useState(sessions);
  const [selectedId, setSelectedId] = useState(first.id);
  const [title, setTitle] = useState(first.title);
  const [subtitle, setSubtitle] = useState(subtitleOf(first));
  const [body, setBody] = useState(first.description ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  function selectSession(s: Session) {
    setSelectedId(s.id);
    setTitle(s.title);
    setSubtitle(subtitleOf(s));
    setBody(s.description ?? "");
    setSaved(false);
    setError(null);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveSession(selectedId, title, body);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    });
  }

  function handleDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    setLocalSessions((prev) => {
      const from = prev.findIndex((s) => s.id === dragId);
      const to = prev.findIndex((s) => s.id === overId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function handleDragEnd() {
    if (dragId) {
      const ids = localSessions.map((s) => s.id);
      startTransition(async () => {
        await reorderSessions(ids);
      });
    }
    setDragId(null);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr_320px]">
      {/* 좌: 세션 리스트 */}
      <Card className="p-3">
        <div className="px-2 pb-2 pt-1 text-xs font-semibold text-muted">세션 목록</div>
        <ul className="space-y-1.5">
          {localSessions.map((s) => {
            const active = s.id === selectedId;
            const isSpecial = s.type === "special";
            const isOffline = s.type === "offline_supplement";
            return (
              <li
                key={s.id}
                draggable
                onDragStart={() => setDragId(s.id)}
                onDragOver={(e) => handleDragOver(e, s.id)}
                onDragEnd={handleDragEnd}
                className={cn(dragId === s.id && "opacity-50")}
              >
                <button
                  onClick={() => selectSession(s)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-control border px-2.5 py-2.5 text-left transition-colors",
                    active
                      ? "border-2 border-primary bg-surface"
                      : isSpecial
                        ? "border-2 border-dashed border-primary bg-info-surface"
                        : "border-hairline bg-surface hover:bg-surface-muted",
                  )}
                >
                  <GripVertical size={15} className="shrink-0 cursor-grab text-faint" />
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      s.is_published ? "bg-success" : "bg-faint",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-muted">{weekLabel(s)}</span>
                      {isSpecial && <Badge tone="info" className="bg-info-surface px-1.5 py-0">special</Badge>}
                      {isOffline && <Badge tone="neutral" className="px-1.5 py-0">offline</Badge>}
                    </div>
                    <div className="truncate text-sm text-ink">{s.title}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* 중앙: 편집 영역 */}
      <Card>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted">세션 제목</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="border-primary shadow-[0_0_0_4px_rgba(44,92,230,.07)]" />
        </div>
        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-semibold text-muted">일시 · 실습 주제</label>
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>

        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-semibold text-muted">MDX 본문</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="resize-y bg-[#FBFCFE] font-mono text-[13px] leading-relaxed"
          />
          <p className="text-xs font-medium text-success">저장 즉시 수강생 화면 반영 · AI 조교 인덱스 자동 갱신</p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye size={15} /> 미리보기
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isPending}>
            <Save size={15} /> {isPending ? "저장 중…" : "저장"}
          </Button>
          {saved && <span className="text-sm font-semibold text-success">저장됨</span>}
          {error && <span className="text-sm font-semibold text-danger">저장 실패: {error}</span>}
        </div>

        {/* 첨부 자료 */}
        <div className="mt-5 border-t border-hairline pt-4">
          <div className="text-xs font-semibold text-muted">첨부 자료</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-control border border-hairline bg-surface-muted px-3 py-2.5">
            <span className="text-sm font-medium text-ink">3주차_실습.pdf</span>
            <Badge tone="progress">v2 · 오늘 교체됨</Badge>
            <Badge tone="wait">공개 예약 9/21 17:00</Badge>
            <Button variant="secondary" className="ml-auto min-h-8 px-3 text-xs">
              <RefreshCw size={13} /> 교체
            </Button>
          </div>
        </div>
      </Card>

      {/* 우: 정책 */}
      <div className="space-y-4">
        <Card className="bg-info-surface">
          <CardTitle>Version Pack 정책</CardTitle>
          <p className="mt-2 text-[13px] leading-relaxed text-info">
            잠금 후 변경은 이력 기록 + 선택적 알림으로 처리됩니다. 버전 팩 재생성은 다음 기수 복제 시에만 수행됩니다.
          </p>
        </Card>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-5"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-[15px] border border-hairline bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-muted">수강생 화면 미리보기</div>
                <h2 className="mt-1 text-xl font-bold text-ink">{title}</h2>
                <p className="mt-1 text-sm text-muted">{subtitle}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="shrink-0 rounded-full p-1.5 text-faint hover:bg-surface-muted hover:text-ink"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 whitespace-pre-wrap rounded-control border border-hairline bg-[#FBFCFE] p-4 text-sm leading-relaxed text-ink">
              {body || "본문이 비어 있습니다."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
