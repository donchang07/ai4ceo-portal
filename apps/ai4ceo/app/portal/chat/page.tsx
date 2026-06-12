import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import {
  Pin,
  FileText,
  Download,
  Sparkles,
  ChevronDown,
  Megaphone,
  Send,
  Plus,
} from "lucide-react";

export default function ChatRoom() {
  return (
    <AppShell>
      <div className="flex h-[calc(100vh-3rem)] flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div>
            <h1 className="text-xl font-semibold">3기 대화방</h1>
            <p className="text-sm text-muted">수강생 12 · 운영자 2 · 강사 1</p>
          </div>
        </div>

        {/* Pinned bar */}
        <div className="mb-3 flex items-center gap-2 rounded-control border bg-info-surface px-3 py-2 text-[13px] text-ink">
          <Pin size={15} className="text-primary" />
          <span className="font-medium">고정</span>
          토요일 보충 세션 사전 과제는 금요일 자정까지 제출해 주세요.
        </div>

        {/* Message stream */}
        <div className="flex-1 space-y-4 overflow-y-auto rounded-card border bg-surface p-5">
          {/* System notice */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1 text-xs text-muted">
              <Megaphone size={14} /> 5주차 강의 영상이 업로드되었습니다.
            </div>
          </div>

          {/* Incoming message */}
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-primary">
              운영
            </div>
            <div className="max-w-[80%]">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted">
                <span className="font-semibold text-ink">운영팀</span> 오후 1:12
              </div>
              <div className="rounded-card rounded-tl-none border bg-surface-muted px-3.5 py-2.5 text-sm">
                이번 주 실습은 회사 보고서 자동화입니다. 샘플 1개 준비 부탁드려요.
              </div>
            </div>
          </div>

          {/* File message */}
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-primary">
              운영
            </div>
            <div className="max-w-[80%]">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted">
                <span className="font-semibold text-ink">운영팀</span> 오후 1:13
              </div>
              <div className="flex items-center gap-3 rounded-card border bg-surface px-3.5 py-3">
                <FileText size={22} className="shrink-0 text-info" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    5주차_보고서_자동화_실습.pdf
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    <Badge tone="read">읽기 전용</Badge>
                    <span>· 5주차 세션</span>
                  </div>
                </div>
                <button className="ml-auto rounded-control border border-[#A9BFD6] p-2 text-ink hover:bg-surface-muted">
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* My message */}
          <div className="flex justify-end">
            <div className="max-w-[80%]">
              <div className="rounded-card rounded-tr-none bg-primary px-3.5 py-2.5 text-sm text-white">
                4주차 과제는 어떤 영상을 기준으로 하면 되나요?
              </div>
            </div>
          </div>

          {/* AI answer */}
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info-surface text-info">
              <Sparkles size={18} />
            </div>
            <div className="max-w-[80%]">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted">
                <span className="font-semibold text-ink">AI 튜터</span>
                <Badge tone="review">강사 검수 필요</Badge>
              </div>
              <div className="rounded-card rounded-tl-none border border-[#C6D8EA] bg-info-surface px-3.5 py-3 text-sm">
                4주차 과제는 <strong>3주차 강의 영상</strong>의 실습 구간(데이터
                연결)을 기준으로 진행됩니다. 영상 32분 부분의 예제를 그대로
                따라 하시면 됩니다.
                <details className="mt-2.5 border-t pt-2.5 text-xs text-muted">
                  <summary className="flex cursor-pointer list-none items-center gap-1 font-medium text-info">
                    <ChevronDown size={14} /> 출처 2개
                  </summary>
                  <ul className="mt-2 space-y-1">
                    <li>· 3주차 강의 영상 — 자막 28:00~35:00</li>
                    <li>· 4주차 과제 안내 (대화방 고정)</li>
                  </ul>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* Composer */}
        <div className="mt-3 flex items-center gap-2">
          <button className="rounded-control border border-[#A9BFD6] p-2.5 text-ink hover:bg-surface-muted">
            <Plus size={18} />
          </button>
          <input
            className="min-h-11 flex-1 rounded-control border border-[#A9BFD6] bg-surface px-3.5 text-sm outline-none placeholder:text-muted focus:border-primary"
            placeholder="메시지를 입력하세요"
          />
          <button className="flex min-h-11 items-center gap-2 rounded-control border border-primary-hover bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">
            <Send size={16} /> 보내기
          </button>
        </div>
      </div>
    </AppShell>
  );
}
