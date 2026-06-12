import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import {
  Sparkles,
  PlayCircle,
  FileText,
  ClipboardList,
  UserRound,
  Send,
} from "lucide-react";

const suggestions = [
  "4주차 과제는 어떤 영상을 기준으로 하나요?",
  "보고서 자동화 실습 준비물이 뭔가요?",
  "Claude Code 설치가 안 될 때는 어떻게 하나요?",
];

export default function AiTutorPage() {
  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-[760px] flex-col">
        <div className="pb-3">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Sparkles size={20} className="text-primary" /> AI 질문
          </h1>
          <p className="text-sm text-muted">
            현재 화면 맥락을 이해하는 질문 도구입니다.
          </p>
        </div>

        {/* Context label */}
        <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[#C6D8EA] bg-info-surface px-3 py-1 text-xs text-info">
          <PlayCircle size={14} /> 이 질문은 4주차 영상 기준입니다.
        </div>

        {/* Conversation */}
        <div className="flex-1 space-y-4 overflow-y-auto rounded-card border bg-surface p-5">
          {/* User question */}
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-card rounded-tr-none bg-primary px-3.5 py-2.5 text-sm text-white">
              4주차 과제는 어떤 영상을 기준으로 하면 되나요?
            </div>
          </div>

          {/* AI answer */}
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info-surface text-info">
              <Sparkles size={18} />
            </div>
            <div className="max-w-[85%]">
              <div className="rounded-card rounded-tl-none border border-[#C6D8EA] bg-info-surface px-3.5 py-3 text-sm">
                4주차 과제는 <strong>3주차 강의 영상</strong>의 데이터 연결 실습
                구간을 기준으로 진행됩니다. 영상 28~35분 예제를 그대로 따라
                하신 뒤, 회사 보고서 샘플에 적용해 제출하시면 됩니다.

                {/* Source cards */}
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <SourceCard icon={<PlayCircle size={15} />} label="3주차 강의 영상" sub="자막 28:00~35:00" />
                  <SourceCard icon={<ClipboardList size={15} />} label="4주차 과제 안내" sub="대화방 고정 메시지" />
                  <SourceCard icon={<FileText size={15} />} label="실습 자료 PDF" sub="보고서 자동화" />
                </div>

                {/* Confidence note */}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-2.5 text-xs text-muted">
                  <Badge tone="review">강사 검수 필요</Badge>
                  <span>현재 업로드된 자료 기준으로 답변했습니다.</span>
                </div>
              </div>
              <button className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <UserRound size={14} /> 강사에게 전달하기
              </button>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((q) => (
            <button
              key={q}
              className="rounded-full border bg-surface px-3 py-1.5 text-xs text-ink hover:bg-surface-muted"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div className="mt-3 flex items-center gap-2">
          <input
            className="min-h-11 flex-1 rounded-control border border-[#A9BFD6] bg-surface px-3.5 text-sm outline-none placeholder:text-muted focus:border-primary"
            placeholder="이 영상에 대해 무엇이든 물어보세요"
          />
          <button className="flex min-h-11 items-center gap-2 rounded-control border border-primary-hover bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">
            <Send size={16} /> 질문
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function SourceCard({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-control border bg-surface px-3 py-2">
      <span className="text-info">{icon}</span>
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-ink">{label}</div>
        <div className="truncate text-[11px] text-muted">{sub}</div>
      </div>
    </div>
  );
}
