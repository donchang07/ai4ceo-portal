import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import {
  ArrowRight,
  CalendarDays,
  Video,
  Wrench,
  GraduationCap,
  CheckCircle,
} from "lucide-react";

const curriculum = [
  { weeks: "1–3주", title: "기초 다지기", desc: "AI·vibe coding 개념과 Claude Code 환경 세팅" },
  { weeks: "4–6주", title: "업무 적용", desc: "보고서·문서 자동화, 회사 데이터 연결 실습" },
  { weeks: "7–10주", title: "첫 결과물 완성", desc: "우리 회사에 적용할 결과물 빌드와 발표" },
];

const builds = [
  { company: "제조 A사", title: "사내 회의록 요약 봇", desc: "주간 회의록을 자동 요약·배포" },
  { company: "유통 B사", title: "보고서 초안 생성기", desc: "매출 데이터로 임원 보고 초안 자동화" },
  { company: "서비스 C사", title: "고객 문의 분류기", desc: "문의를 유형별로 자동 분류·라우팅" },
];

const faqs = [
  { q: "컴퓨터를 잘 못 다뤄도 되나요?", a: "토요일 오프라인 보충 세션과 1:1 코칭으로 실습 격차를 보완합니다." },
  { q: "수행비서·임원과 함께 들을 수 있나요?", a: "CEO 계정에 동반자(assistant)를 연결해 함께 학습하고 일부를 위임할 수 있습니다." },
  { q: "결제는 어떻게 하나요?", a: "법인 계좌이체 기반 인보이스·세금계산서 발행을 지원합니다." },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Hero */}
      <section className="mx-auto max-w-[1100px] px-5 pb-12 pt-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C6D8EA] bg-info-surface px-3 py-1 text-xs font-medium text-info">
          CEO·임원 대상 · 10주 기수제
        </div>
        <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
          CEO를 위한 바이브코딩 스쿨
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          10주 동안 배우고, 만들고, 우리 회사에 적용할 첫 결과물을 완성합니다.
          CEO와 임원이 AI와 vibe coding을 직접 손으로 익히는 기수제 실행 포탈.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/apply"
            className="inline-flex min-h-11 items-center gap-2 rounded-control border border-primary-hover bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            지원하기 <ArrowRight size={16} />
          </Link>
          <Link
            href="#course"
            className="inline-flex min-h-11 items-center gap-2 rounded-control border border-[#A9BFD6] bg-surface px-5 text-sm font-semibold text-ink hover:bg-surface-muted"
          >
            과정 살펴보기
          </Link>
        </div>

        {/* Evidence strip */}
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: <CalendarDays size={18} />, label: "주 1회 · 총 10회", sub: "Zoom 정규 강의" },
            { icon: <Video size={18} />, label: "녹화 다시보기", sub: "기수별 read-only" },
            { icon: <Wrench size={18} />, label: "첫 결과물 완성", sub: "회사 적용 중심" },
            { icon: <GraduationCap size={18} />, label: "수료 후 AS", sub: "동문 네트워크" },
          ].map((s, i) => (
            <div key={i} className="rounded-card border bg-surface p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-control bg-surface-muted text-primary">
                {s.icon}
              </span>
              <div className="mt-2.5 text-sm font-semibold">{s.label}</div>
              <div className="text-xs text-muted">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Course intro */}
      <section id="course" className="border-t bg-surface-muted/40">
        <div className="mx-auto max-w-[1100px] px-5 py-14">
          <h2 className="text-2xl font-semibold">과정 소개</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            성공의 기준은 수료가 아니라 &ldquo;직접 만든 결과물과 회사 적용&rdquo;입니다.
            10주를 세 단계로 나눠 첫 결과물까지 끌고 갑니다.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {curriculum.map((c) => (
              <div key={c.weeks} className="rounded-card border bg-surface p-5">
                <div className="text-xs font-semibold text-primary">{c.weeks}</div>
                <div className="mt-1 text-lg font-semibold">{c.title}</div>
                <p className="mt-1.5 text-sm text-muted">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Build showcase */}
      <section className="mx-auto max-w-[1100px] px-5 py-14">
        <h2 className="text-2xl font-semibold">수료생이 만든 결과물</h2>
        <p className="mt-2 text-sm text-muted">
          교육이 끝나면 강의 노트가 아니라 회사에 적용한 결과물이 남습니다.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {builds.map((b) => (
            <div key={b.title} className="rounded-card border bg-surface p-5">
              <div className="text-xs text-muted">{b.company}</div>
              <div className="mt-1 text-base font-semibold">{b.title}</div>
              <p className="mt-1.5 text-sm text-muted">{b.desc}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-success">
                <CheckCircle size={14} /> 회사 적용 완료
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t bg-surface-muted/40">
        <div className="mx-auto max-w-[1100px] px-5 py-14">
          <h2 className="text-2xl font-semibold">질의응답</h2>
          <div className="mt-6 flex flex-col gap-3">
            {faqs.map((f) => (
              <details key={f.q} className="rounded-card border bg-surface p-5">
                <summary className="cursor-pointer list-none text-base font-medium">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-start gap-3 rounded-card border border-[#C6D8EA] bg-info-surface p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-semibold">다음 기수 모집 중</div>
              <p className="text-sm text-muted">5분이면 지원할 수 있습니다. 합격 후 계정이 생성됩니다.</p>
            </div>
            <Link
              href="/apply"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-control border border-primary-hover bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              지원하기 <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-[1100px] px-5 py-8 text-xs text-muted">
          AI4CEO Portal · AIBB LAB · 장동인 교수
        </div>
      </footer>
    </div>
  );
}
