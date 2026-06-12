import { AppShell } from "@/components/app-shell";
import { Badge, Button } from "@/components/ui";
import {
  Clock,
  Video,
  PlayCircle,
  FileText,
  ClipboardList,
  CalendarDays,
  MapPin,
} from "lucide-react";

type Session = {
  week: number;
  title: string;
  when: string;
  type: "regular" | "supplement";
  status: "done" | "upcoming";
  hasVideo: boolean;
  hasMaterial: boolean;
  hasAssignment: boolean;
};

const sessions: Session[] = [
  { week: 3, title: "데이터 연결과 자동화 기초", when: "5월 31일 (토) 14:00", type: "regular", status: "done", hasVideo: true, hasMaterial: true, hasAssignment: true },
  { week: 4, title: "프롬프트로 업무 문서 만들기", when: "6월 7일 (토) 14:00", type: "regular", status: "done", hasVideo: true, hasMaterial: true, hasAssignment: true },
  { week: 5, title: "AI로 사내 보고 자동화", when: "6월 14일 (토) 14:00", type: "regular", status: "upcoming", hasVideo: false, hasMaterial: true, hasAssignment: true },
  { week: 0, title: "오프라인 보충 — 실습 따라잡기", when: "6월 21일 (토) 15:00", type: "supplement", status: "upcoming", hasVideo: false, hasMaterial: false, hasAssignment: false },
  { week: 6, title: "회사 데이터로 첫 결과물 만들기", when: "6월 28일 (토) 14:00", type: "regular", status: "upcoming", hasVideo: false, hasMaterial: false, hasAssignment: false },
];

export default function SessionsPage() {
  return (
    <AppShell>
      <h1 className="text-xl font-semibold">세션</h1>
      <p className="mb-5 text-sm text-muted">
        총 10회 정규 세션과 토요일 오프라인 보충 세션을 한눈에 봅니다.
      </p>

      <div className="flex flex-col gap-3">
        {sessions.map((s, i) => (
          <div
            key={i}
            className="rounded-card border bg-surface p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-1.5 flex items-center gap-2">
                  {s.type === "supplement" ? (
                    <Badge tone="due">보충 세션</Badge>
                  ) : (
                    <span className="rounded-control bg-surface-muted px-2 py-0.5 text-xs font-semibold text-muted">
                      {s.week}주차
                    </span>
                  )}
                  {s.status === "done" ? (
                    <Badge tone="done">완료</Badge>
                  ) : (
                    <Badge tone="read">예정</Badge>
                  )}
                </div>
                <div className="text-base font-semibold">{s.title}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <Clock size={15} /> {s.when}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {s.type === "supplement" ? (
                      <>
                        <MapPin size={15} /> 대면 · 강남 실습실
                      </>
                    ) : (
                      <>
                        <Video size={15} /> Zoom
                      </>
                    )}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                  {s.hasVideo && (
                    <span className="flex items-center gap-1.5 text-info">
                      <PlayCircle size={15} /> 강의 영상
                    </span>
                  )}
                  {s.hasMaterial && (
                    <span className="flex items-center gap-1.5">
                      <FileText size={15} /> 강의자료
                    </span>
                  )}
                  {s.hasAssignment && (
                    <span className="flex items-center gap-1.5">
                      <ClipboardList size={15} /> 과제 연결
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                {s.status === "done" ? (
                  <Button variant="secondary">
                    <PlayCircle size={16} /> 다시 보기
                  </Button>
                ) : (
                  <Button variant="softcta">
                    <CalendarDays size={16} /> 세션 보기
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
