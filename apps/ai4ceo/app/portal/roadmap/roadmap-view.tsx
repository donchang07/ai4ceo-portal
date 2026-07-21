"use client";

import { useState } from "react";
import { Map, MonitorPlay, Save, X, CheckCircle2, Hammer } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Button, Card, CardTitle, Callout, Chip, SectionTitle, Textarea } from "@/components/ui";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";
import { cn } from "@/lib/core/cn";

// Design Ref: prd-v30-remaining.design.md §4 F5 — SCR-08 (US-09).
// KPI "AX 로드맵 초안 작성률 ≥70%"의 실행 수단. 10주차 발표 모드 포함.

export interface RoadmapRow {
  status: string | null;
  diagnosis: string | null;
  priorities: string | null;
  plan_90d: string | null;
  expansion: string | null;
  build_ids: string[] | null;
}

export interface BuildOption {
  id: string;
  title: string | null;
}

type SectionKey = "diagnosis" | "priorities" | "plan_90d" | "expansion";

const SECTIONS: { key: SectionKey; no: string; title: string; guide: string; placeholder: string }[] = [
  {
    key: "diagnosis",
    no: "1",
    title: "현황 진단",
    guide: "우리 회사의 AI 활용 현재 수준을 솔직하게 적습니다. 어떤 업무에 얼마나 쓰이고 있는지, 무엇이 막고 있는지.",
    placeholder: "예: 개인별 ChatGPT 사용 수준. 데이터가 부서별 엑셀에 흩어져 있고, IT 전담 인력은 1명.",
  },
  {
    key: "priorities",
    no: "2",
    title: "우선 과제",
    guide: "과정에서 직접 만들어 본 것을 근거로, 가장 먼저 해결할 업무 2~3개를 고릅니다. 아래에서 내 Build를 연결하세요.",
    placeholder: "예: ① 주간 보고 취합 자동화(내 Build #1 확장) ② 고객 문의 분류 ③ 재고 현황 대시보드.",
  },
  {
    key: "plan_90d",
    no: "3",
    title: "90일 계획",
    guide: "수료 후 90일 안에 실행할 것을 주 단위로 적습니다. 누가·무엇을·언제까지.",
    placeholder: "예: 1~2주차 — 내 Build를 실데이터로 전환. 3~6주차 — 팀 2명에게 사용법 이전. 7~12주차 — 부서 확산.",
  },
  {
    key: "expansion",
    no: "4",
    title: "확산 계획",
    guide: "성과가 확인되면 조직 전체로 어떻게 넓힐지. 교육·권한·데이터 연결·예산 순서로.",
    placeholder: "예: 부서장 대상 사내 워크숍 → 공용 데이터 정리 → 외주가 필요한 부분과 내재화할 부분 구분.",
  },
];

export function RoadmapView({
  userId,
  cohortId,
  userName,
  initial,
  builds,
}: {
  userId: string;
  cohortId: string | null;
  userName: string;
  initial: RoadmapRow | null;
  builds: BuildOption[];
}) {
  const [sections, setSections] = useState<Record<SectionKey, string>>({
    diagnosis: initial?.diagnosis ?? "",
    priorities: initial?.priorities ?? "",
    plan_90d: initial?.plan_90d ?? "",
    expansion: initial?.expansion ?? "",
  });
  const [buildIds, setBuildIds] = useState<string[]>(initial?.build_ids ?? []);
  const [status, setStatus] = useState<string>(initial?.status ?? "draft");
  const [present, setPresent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filled = SECTIONS.filter((s) => sections[s.key].trim().length > 0).length;

  async function save(nextStatus?: string) {
    setSaving(true);
    setError(null);
    try {
      const sb = getSupabaseBrowser();
      const { error: err } = await sb.from("roadmaps").upsert(
        {
          user_id: userId,
          cohort_id: cohortId,
          status: nextStatus ?? status,
          diagnosis: sections.diagnosis || null,
          priorities: sections.priorities || null,
          plan_90d: sections.plan_90d || null,
          expansion: sections.expansion || null,
          build_ids: buildIds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (err) throw err;
      if (nextStatus) setStatus(nextStatus);
      setSavedAt(new Date().toLocaleTimeString("ko-KR"));
    } catch {
      setError("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  function toggleBuild(id: string) {
    setBuildIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  }

  const linkedBuilds = builds.filter((b) => buildIds.includes(b.id));

  return (
    <PortalShell title="AX 로드맵">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <SectionTitle>우리 회사 AX 로드맵</SectionTitle>
            <Badge tone={status === "final" ? "done" : "progress"}>
              {status === "final" ? "발표본 확정" : "초안 작성 중"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            과정에서 만든 것을 회사의 AI 추진 계획으로 전환하세요. 10주차 발표 자료가 됩니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => save()} disabled={saving}>
            <Save size={15} /> 저장
          </Button>
          <Button variant="primary" onClick={() => setPresent(true)} disabled={filled === 0}>
            <MonitorPlay size={15} /> 발표 모드
          </Button>
        </div>
      </div>

      {error ? <Callout className="mb-4">{error}</Callout> : null}
      {savedAt ? <p className="mb-4 text-xs text-muted">마지막 저장: {savedAt}</p> : null}

      <div className="space-y-5">
        {SECTIONS.map((s) => (
          <Card key={s.key}>
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-info-surface text-sm font-bold text-primary tnum">
                {s.no}
              </span>
              <CardTitle>{s.title}</CardTitle>
              {sections[s.key].trim() ? <CheckCircle2 size={16} className="text-success" /> : null}
            </div>
            <p className="mt-2 text-[13px] text-muted">{s.guide}</p>
            <Textarea
              rows={4}
              className="mt-3"
              placeholder={s.placeholder}
              value={sections[s.key]}
              onChange={(e) => setSections((prev) => ({ ...prev, [s.key]: e.target.value }))}
            />
            {s.key === "priorities" ? (
              <div className="mt-3">
                <p className="text-xs font-semibold text-muted">근거로 연결할 내 결과물</p>
                {builds.length === 0 ? (
                  <p className="mt-1.5 text-xs text-muted">
                    아직 등록된 결과물이 없습니다.{" "}
                    <a href="/portal/builds" className="text-primary hover:underline">
                      내 결과물에서 먼저 등록
                    </a>
                    하면 여기서 연결할 수 있습니다.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {builds.map((b) => (
                      <Chip key={b.id} active={buildIds.includes(b.id)} onClick={() => toggleBuild(b.id)}>
                        <Hammer size={13} /> {b.title ?? "무제"}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[15px] border border-hairline bg-surface px-5 py-4">
        <div className="text-sm text-muted">
          <span className="tnum font-semibold text-ink">{filled}/4</span> 단계 작성됨
          {status !== "final" ? " — 4단계를 채우면 발표본으로 확정할 수 있습니다." : ""}
        </div>
        {status === "final" ? (
          <Button variant="secondary" onClick={() => save("draft")} disabled={saving}>
            초안으로 되돌리기
          </Button>
        ) : (
          <Button variant="primary" onClick={() => save("final")} disabled={saving || filled < 4}>
            발표본으로 확정
          </Button>
        )}
      </div>

      {/* 발표 모드 (SCR-08 ⑥) */}
      {present ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink text-white">
          <div className="mx-auto max-w-[900px] px-8 py-12">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/60">AX 로드맵 발표 · {userName}</p>
              <button
                type="button"
                onClick={() => setPresent(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
                aria-label="발표 모드 닫기"
              >
                <X size={18} />
              </button>
            </div>
            <h1 className="mt-6 flex items-center gap-3 text-3xl font-bold tracking-tight">
              <Map size={30} className="text-accent" /> 우리 회사 AX 로드맵
            </h1>
            <div className="mt-10 space-y-10">
              {SECTIONS.map((s) => (
                <section key={s.key}>
                  <h2 className="flex items-center gap-3 text-xl font-semibold">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-base tnum">{s.no}</span>
                    {s.title}
                  </h2>
                  <p className={cn("mt-3 whitespace-pre-wrap text-[15px] leading-relaxed", sections[s.key].trim() ? "text-white/90" : "text-white/35")}>
                    {sections[s.key].trim() || "(작성되지 않음)"}
                  </p>
                  {s.key === "priorities" && linkedBuilds.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {linkedBuilds.map((b) => (
                        <span key={b.id} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[13px]">
                          <Hammer size={13} /> {b.title ?? "무제"}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </PortalShell>
  );
}
