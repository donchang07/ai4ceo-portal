import { Terminal, Layout, Users, Settings, ArrowRight, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { getCurrentUser } from "@/lib/db/auth";
import { SiteFooter } from "@/components/site-footer";
import { ProductCheckout } from "@/components/product-checkout";
import { Badge, Button, Card, SectionTitle, Callout } from "@/components/ui";
import { TRACKS } from "@/lib/core/constants";
import { getPublicProducts } from "@/lib/billing/products";
import { getTossClientKey } from "@/lib/billing/toss";
import { getCohortSchedule, type CohortSchedule } from "@/lib/db/cohort-schedule";

const trackIcons: Record<string, LucideIcon> = {
  terminal: Terminal,
  layout: Layout,
  users: Users,
  settings: Settings,
};

// 회차 수·개강일은 sessions 에서 온다 — 화면마다 다른 날짜가 뜨는 일이 없도록 한 곳에서만 계산한다.
function buildStats(schedule: CohortSchedule | null) {
  let openingDay = "미정";
  if (schedule) {
    const parts = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "numeric",
      day: "numeric",
      weekday: "short",
    }).formatToParts(new Date(schedule.startsAt));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    openingDay = `${get("month")}/${get("day")}(${get("weekday")})`;
  }

  return [
    { value: "무제한", label: "모집 정원 (Zoom)" },
    { value: schedule ? `${schedule.sessionCount}회` : "—", label: "정규 과정" },
    { value: `${TRACKS.length}대`, label: "핵심 트랙" },
    { value: openingDay, label: "개강" },
  ];
}

export default async function Landing() {
  const [products, schedule, user] = await Promise.all([
    getPublicProducts(),
    getCohortSchedule(),
    getCurrentUser(),
  ]);
  const stats = buildStats(schedule);

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader user={user} />

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

      {/* 수강료 안내 — 안내에서 끝나지 않고 이 자리에서 바로 결제할 수 있다 */}
      <section id="pricing" className="border-t border-hairline bg-surface-muted/40">
        <div className="mx-auto max-w-[1100px] px-6 py-14">
          <SectionTitle>수강료 안내</SectionTitle>
          <p className="mt-1 text-sm text-muted">
            아래에서 바로 결제하실 수 있습니다. 로그인 없이 신용·체크카드, 계좌이체, 가상계좌(무통장입금)로
            결제하실 수 있습니다.
          </p>
          <div className="mt-6">
            <ProductCheckout products={products} clientKey={getTossClientKey()} />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-hairline bg-canvas">
        <div className="mx-auto flex max-w-[1100px] flex-col items-start gap-4 px-6 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-bold text-ink">18기 모집이 진행 중입니다</div>
            <p className="mt-1 text-sm text-muted">
              {schedule ? `개강 ${schedule.label} · ` : ""}Zoom 온라인 강의라 정원 제한 없이 모집합니다.
              로그인 없이 5분이면 지원할 수 있습니다.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button href="/apply" variant="primary">
              지원하기 <ArrowRight size={16} />
            </Button>
            <Button href="/pay" variant="secondary">
              수강료 결제
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
