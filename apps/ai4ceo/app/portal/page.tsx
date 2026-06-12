import { AppShell } from "@/components/app-shell";
import { Badge, Button } from "@/components/ui";
import {
  CalendarDays,
  Clock,
  Video,
  ListChecks,
  PlayCircle,
  Bell,
  CircleDashed,
  ArrowRight,
  MessagesSquare,
  Pin,
  FileText,
  MessageSquareText,
  Sparkles,
  Send,
  BookOpen,
  ClipboardList,
} from "lucide-react";

const cardBase = "rounded-card border bg-surface p-5";
const featureBase =
  "rounded-card border border-[#C6D8EA] bg-info-surface border-l-[3px] border-l-primary p-5";
const cardTitle =
  "mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted";

export default function CohortHome() {
  return (
    <AppShell>
      <h1 className="text-xl font-semibold">안녕하세요, 장동인 대표님</h1>
      <p className="mb-5 text-sm text-muted">
        오늘 확인하면 좋은 것부터 정리했습니다.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Next Session */}
        <div className={`${featureBase} md:col-span-2`}>
          <div className={cardTitle}>
            <CalendarDays size={16} /> Next Session
          </div>
          <div className="text-lg font-semibold">
            5주차 · AI로 사내 보고 자동화
          </div>
          <p className="mb-4 text-sm text-muted">
            실습 위주로 진행됩니다. 회사 보고서 샘플 1개를 준비해 오세요.
          </p>
          <div className="mb-1.5 flex items-center gap-2 text-[13px] text-muted">
            <Clock size={15} /> 2026년 6월 14일 (토) 오후 2:00 – 4:00
          </div>
          <div className="mb-1.5 flex items-center gap-2 text-[13px] text-muted">
            <Video size={15} /> Zoom · 시작 10분 전 입장 가능
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary">
              <Video size={16} /> 세션 입장
            </Button>
            <Button variant="secondary">
              <BookOpen size={16} /> 준비물 보기
            </Button>
          </div>
        </div>

        {/* Today's Actions */}
        <div className={cardBase}>
          <div className={cardTitle}>
            <ListChecks size={16} /> Today&apos;s Actions
          </div>
          <ul className="mb-4 flex flex-col gap-2 text-sm">
            <li className="flex items-center gap-2">
              <CircleDashed size={16} className="text-muted" /> 4주차 과제 미제출
              <Badge tone="due">마감 임박</Badge>
            </li>
            <li className="flex items-center gap-2">
              <PlayCircle size={16} className="text-muted" /> 5주차 강의 영상
              업로드됨
            </li>
            <li className="flex items-center gap-2">
              <Bell size={16} className="text-muted" /> 운영 공지 1건 확인
            </li>
          </ul>
          <Button variant="secondary">
            <ClipboardList size={16} /> 과제 제출하기
          </Button>
        </div>

        {/* My Build */}
        <div className={cardBase}>
          <div className={cardTitle}>
            <CircleDashed size={16} /> My Build
          </div>
          <div className="text-lg font-semibold">사내 회의록 요약 봇</div>
          <p className="mb-4 text-sm text-muted">
            3단계 / 5단계 — 다음: 회사 데이터 연결 테스트
          </p>
          <Badge tone="edit">진행 중</Badge>
          <div className="mt-4">
            <Button variant="ghost">
              <ArrowRight size={16} /> 다음 단계 진행
            </Button>
          </div>
        </div>

        {/* Cohort Activity */}
        <div className={cardBase}>
          <div className={cardTitle}>
            <MessagesSquare size={16} /> Cohort Activity
          </div>
          <div className="mb-1.5 flex items-center gap-2 text-[13px] text-muted">
            <Pin size={15} /> 토요일 사전 과제 안내가 고정되었습니다
          </div>
          <div className="mb-1.5 flex items-center gap-2 text-[13px] text-muted">
            <FileText size={15} /> 새 Drive 파일 2개 <Badge tone="read">읽기 전용</Badge>
          </div>
          <div className="mb-1.5 flex items-center gap-2 text-[13px] text-muted">
            <MessageSquareText size={15} /> 새 메시지 8개
          </div>
          <div className="mt-4">
            <Button variant="ghost">
              <MessagesSquare size={16} /> 대화방 열기
            </Button>
          </div>
        </div>

        {/* Ask AI */}
        <div className={`${featureBase} md:col-span-2`}>
          <div className={cardTitle}>
            <Sparkles size={16} /> Ask AI
          </div>
          <p className="mb-3 text-sm text-muted">
            현재 3기 맥락(세션·영상·자료)을 기준으로 답합니다.
          </p>
          <div className="flex gap-2">
            <input
              className="min-h-10 flex-1 rounded-control border border-[#A9BFD6] bg-surface px-3 text-sm outline-none placeholder:text-muted focus:border-primary"
              placeholder="예: 4주차 과제는 어떤 영상을 기준으로 하나요?"
            />
            <Button variant="primary">
              <Send size={16} /> 질문
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
