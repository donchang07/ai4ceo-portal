import { Terminal, Layout, Users, Settings, ArrowRight, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { Badge, Button, Card, SectionTitle, Callout } from "@/components/ui";
import { COHORT_18, TRACKS } from "@/lib/core/constants";

const trackIcons: Record<string, LucideIcon> = {
  terminal: Terminal,
  layout: Layout,
  users: Users,
  settings: Settings,
};

const stats = [
  { value: "무제한", label: "모집 정원 (Zoom)" },
  { value: "10회", label: "정규 과정" },
  { value: "4대", label: "핵심 트랙" },
  { value: "9/9(수)", label: "개강" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-canvas">
        <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-16">
          <Badge tone="progress">18기 모집 중</Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-ink md:text-5xl">
            CEO가 직접 만드는 첫 번째 AI 결과물
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            10주 동안 배우고, 만들고, 우리 회사에 적용합니다. CEO와 임원이 AI와
            바이브코딩을 직접 손으로 익히고, 강의 노트가 아니라 회사에 적용한 결과물을
            남기는 기수제 실행 과정입니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/apply" variant="primary">
              지원하기 <ArrowRight size={16} />
            </Button>
            <Button href="/program" variant="secondary">
              과정 안내 보기
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-12 grid max-w-2xl grid-cols-2 divide-x divide-hairline rounded-[15px] border border-hairline bg-surface md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="px-5 py-4">
                <div className="tnum text-xl font-bold text-ink">{s.value}</div>
                <div className="mt-0.5 text-xs text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section id="curriculum" className="mx-auto max-w-[1100px] scroll-mt-20 px-6 py-16">
        <SectionTitle>4대 핵심 트랙</SectionTitle>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          도구를 배우는 데서 그치지 않고, 우리 회사에 적용할 수 있는 역량으로 이어집니다.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {TRACKS.map((t) => {
            const Icon = trackIcons[t.icon] ?? Terminal;
            return (
              <Card key={t.key}>
                <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-info-surface text-primary">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 text-[17px] font-semibold text-ink">{t.name}</h3>
                <p className="mt-2 text-sm text-muted">{t.desc}</p>
              </Card>
            );
          })}
        </div>

        {/* AX integrated module callout */}
        <Callout className="mt-6">
          <Layers size={16} className="mt-0.5 shrink-0" />
          <span>
            도구 학습 → 우리 회사 적용 → AX 로드맵. 1·3·5·7·10주차에 기업 AX 모듈이
            삽입됩니다.
          </span>
        </Callout>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-hairline bg-surface-muted/40">
        <div className="mx-auto flex max-w-[1100px] flex-col items-start gap-4 px-6 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-bold text-ink">18기 모집이 진행 중입니다</div>
            <p className="mt-1 text-sm text-muted">
              개강 {COHORT_18.eduStartLabel} · Zoom 온라인 강의라 정원 제한 없이 모집합니다.
              로그인 없이 5분이면 지원할 수 있습니다.
            </p>
          </div>
          <Button href="/apply" variant="primary" className="shrink-0">
            지원하기 <ArrowRight size={16} />
          </Button>
        </div>
      </section>

      <footer className="border-t border-hairline bg-canvas">
        <div className="mx-auto max-w-[1100px] px-6 py-8 text-xs text-faint">
          AI4CEO Portal · AIBB LAB · 장동인 교수 · {COHORT_18.versionLabel}
        </div>
      </footer>
    </div>
  );
}
