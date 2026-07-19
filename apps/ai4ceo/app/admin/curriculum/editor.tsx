"use client";

import { useState } from "react";
import { Clock, Eye, GripVertical, RefreshCw, Save } from "lucide-react";
import { Badge, Button, Card, CardTitle, Input, Textarea } from "@/components/ui";
import type { Session } from "@/lib/db/types";
import { cn } from "@/lib/core/cn";

type LogEntry = {
  id: string;
  author: string;
  time: string;
  action: string;
  published: boolean;
  notified: boolean;
};

const INITIAL_LOG: LogEntry[] = [
  { id: "l1", author: "장동인 교수", time: "오늘 14:20", action: "본문 수정", published: true, notified: true },
  { id: "l2", author: "장동인 교수", time: "오늘 11:05", action: "첨부 자료 v2 교체", published: true, notified: false },
  { id: "l3", author: "운영팀", time: "어제 17:40", action: "공개 예약 설정", published: false, notified: false },
  { id: "l4", author: "장동인 교수", time: "2일 전 09:12", action: "세션 제목 변경", published: true, notified: true },
];

function weekLabel(s: Session): string {
  return s.week_no > 0 ? `${s.week_no}주차` : "보충";
}

function subtitleOf(s: Session): string {
  const d = new Date(s.starts_at);
  const time = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return s.track ? `${time} · ${s.track}` : time;
}

export function CurriculumEditor({ sessions }: { sessions: Session[] }) {
  const first = sessions[0];
  const [selectedId, setSelectedId] = useState(first.id);
  const [title, setTitle] = useState(first.title);
  const [subtitle, setSubtitle] = useState(subtitleOf(first));
  const [body, setBody] = useState(first.description ?? "");
  const [log, setLog] = useState<LogEntry[]>(INITIAL_LOG);
  const [saved, setSaved] = useState(false);

  function selectSession(s: Session) {
    setSelectedId(s.id);
    setTitle(s.title);
    setSubtitle(subtitleOf(s));
    setBody(s.description ?? "");
    setSaved(false);
  }

  function handleSave() {
    setLog((prev) => [
      { id: `l${Date.now()}`, author: "장동인 교수", time: "방금 전", action: "본문 수정", published: true, notified: false },
      ...prev,
    ]);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr_320px]">
      {/* 좌: 세션 리스트 */}
      <Card className="p-3">
        <div className="px-2 pb-2 pt-1 text-xs font-semibold text-muted">세션 목록</div>
        <ul className="space-y-1.5">
          {sessions.map((s) => {
            const active = s.id === selectedId;
            const isSpecial = s.type === "special";
            const isOffline = s.type === "offline_supplement";
            return (
              <li key={s.id}>
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
          <Button variant="outline">
            <Eye size={15} /> 미리보기
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Save size={15} /> 저장
          </Button>
          {saved && <span className="text-sm font-semibold text-success">저장됨</span>}
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

      {/* 우: 변경 이력 + 정책 */}
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>변경 이력</CardTitle>
            <Badge tone="neutral">D-15</Badge>
          </div>
          <ol className="mt-4 space-y-4">
            {log.map((e, i) => (
              <li key={e.id} className="relative flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  {i < log.length - 1 && <span className="mt-1 w-px flex-1 bg-hairline" />}
                </div>
                <div className="pb-1">
                  <div className="text-sm font-medium text-ink">{e.action}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                    <span>{e.author}</span>
                    <span className="text-faint">·</span>
                    <Clock size={11} /> {e.time}
                  </div>
                  <div className="mt-1.5 flex gap-1.5">
                    {e.published && <Badge tone="done" className="px-1.5 py-0">공개</Badge>}
                    {e.notified && <Badge tone="info" className="bg-info-surface px-1.5 py-0">알림 발송</Badge>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="bg-info-surface">
          <CardTitle>Version Pack 정책</CardTitle>
          <p className="mt-2 text-[13px] leading-relaxed text-info">
            잠금 후 변경은 이력 기록 + 선택적 알림으로 처리됩니다. 버전 팩 재생성은 다음 기수 복제 시에만 수행됩니다.
          </p>
        </Card>
      </div>
    </div>
  );
}
