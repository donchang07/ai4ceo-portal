import { ArrowRight, MessageCircleQuestion } from "lucide-react";
import { AlumniShell } from "@/components/alumni-shell";
import { Badge, Button, Card, CardTitle, Callout, Chip, SectionTitle } from "@/components/ui";
import { getPosts } from "@/lib/db/queries";
import { MEMBERSHIP_KRW, formatKRW } from "@/lib/core/constants";

const AS_QUESTIONS: { title: string; status: "done" | "wait" }[] = [
  { title: "사내 에이전트 권한 설계, 어디까지 열어야 하나요?", status: "done" },
  { title: "RAG 파이프라인에 사내 문서 반영 주기 질문", status: "done" },
  { title: "Claude Code 팀 도입 시 라이선스 정책 문의", status: "wait" },
  { title: "AX 성과 지표(KPI) 설계 자문 요청", status: "wait" },
];

const OFFICE_HOURS: { label: string; state: "closed" | "open" | "selected" }[] = [
  { label: "7/22 (수) 14:00", state: "closed" },
  { label: "7/29 (수) 14:00", state: "selected" },
  { label: "8/5 (수) 14:00", state: "open" },
];

const DIRECTORY: { name: string; company: string; initial: string }[] = [
  { name: "김성호 대표", company: "한빛소프트웨어", initial: "김" },
  { name: "이재민 대표", company: "그린커머스", initial: "이" },
  { name: "박수진 대표", company: "노바디자인랩", initial: "박" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default async function AlumniHomePage() {
  const posts = await getPosts();
  const briefs = posts.filter((p) => p.board === "brief").slice(0, 2);

  return (
    <AlumniShell>
      <section>
        <SectionTitle>안녕하세요, 대표님</SectionTitle>
        <div className="mt-4">
          <Callout>
            <ArrowRight size={16} className="mt-0.5 shrink-0" />
            <span>
              그때 만든 결과물, 지금 어디까지 쓰이고 있나요?{" "}
              <a href="/alumni#checkin" className="font-semibold underline underline-offset-2">
                3분 체크인 →
              </a>
            </span>
          </Callout>
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* 열1 — AS Q&A */}
        <div id="as" className="scroll-mt-20">
        <Card>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>AS Q&amp;A</CardTitle>
            <Badge tone="info">영업일 3일</Badge>
          </div>
          <ul className="mt-4 space-y-3">
            {AS_QUESTIONS.map((q) => (
              <li key={q.title} className="flex items-start gap-2.5">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    q.status === "done" ? "bg-success" : "bg-warning"
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{q.title}</p>
                  <p className="text-xs text-faint">{q.status === "done" ? "답변 완료" : "대기"}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Button variant="outline" full href="/alumni#as-new">
              <MessageCircleQuestion size={16} />
              질문하기
            </Button>
          </div>
        </Card>
        </div>

        {/* 열2 — 오피스아워 + 디렉토리 */}
        <div id="directory" className="scroll-mt-20">
        <Card>
          <CardTitle>오피스아워</CardTitle>
          <div className="mt-4 flex flex-wrap gap-2">
            {OFFICE_HOURS.map((slot) =>
              slot.state === "closed" ? (
                <span
                  key={slot.label}
                  className="inline-flex items-center rounded-full border border-cardline bg-surface px-3 py-1.5 text-[13px] font-medium text-faint line-through"
                >
                  {slot.label}
                </span>
              ) : (
                <Chip key={slot.label} active={slot.state === "selected"}>
                  {slot.label}
                </Chip>
              ),
            )}
          </div>

          <div className="mt-6 border-t border-hairline pt-5">
            <CardTitle>동문 디렉토리</CardTitle>
            <p className="mt-1 text-xs text-faint">공개에 동의(옵트인)한 동문만 노출됩니다.</p>
            <ul className="mt-4 space-y-3">
              {DIRECTORY.map((m) => (
                <li key={m.name} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-semibold text-primary">
                    {m.initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                    <p className="truncate text-xs text-muted">{m.company}</p>
                  </div>
                  <a href="/alumni#directory" className="shrink-0 text-xs font-semibold text-primary hover:underline">
                    프로필 보기
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        </div>

        {/* 열3 — 멤버십 카드(다크) + 최신 브리프 */}
        <div className="space-y-5">
          <div className="rounded-[15px] bg-dark p-5 text-white">
            <p className="text-xs font-semibold tracking-wide text-white/60">AI4CEO MEMBERSHIP</p>
            <p className="mt-3 text-2xl font-bold tnum">{formatKRW(MEMBERSHIP_KRW)}</p>
            <p className="text-sm text-white/60">연간 · 만료 2027-06-30</p>
            <div className="mt-5">
              <Button variant="primary" full href="/alumni/membership">
                갱신하기
              </Button>
            </div>
          </div>

          <div id="archive" className="scroll-mt-20">
          <Card>
            <CardTitle>최신 브리프</CardTitle>
            <ul className="mt-4 space-y-3">
              {briefs.map((b) => (
                <li key={b.id}>
                  <a href="/trends" className="block">
                    <p className="text-sm font-medium text-ink hover:underline">{b.title}</p>
                    <p className="mt-0.5 text-xs text-faint tnum">{formatDate(b.published_at)}</p>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
          </div>
        </div>
      </div>
    </AlumniShell>
  );
}
