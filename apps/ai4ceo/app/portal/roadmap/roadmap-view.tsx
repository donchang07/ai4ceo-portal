"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Map as MapIcon, X } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button, Card, Chip, SectionTitle, Textarea } from "@/components/ui";
import { cn } from "@/lib/core/cn";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";

type StepKey = "diagnosis" | "priorities" | "plan_90d" | "expansion";
type RoadmapStatus = "draft" | "final";

interface RoadmapRow {
  id: string;
  user_id: string;
  cohort_id: string | null;
  status: RoadmapStatus;
  diagnosis: string | null;
  priorities: string | null;
  plan_90d: string | null;
  expansion: string | null;
  build_ids: string[];
  created_at: string;
  updated_at: string;
}

interface Build {
  id: string;
  title: string;
}

const STEPS: { key: StepKey; title: string; hint: string }[] = [
  { key: "diagnosis", title: "현황 진단", hint: "우리 회사의 현재 AI 활용 수준과 문제를 진단합니다." },
  { key: "priorities", title: "우선 과제", hint: "가장 먼저 풀어야 할 AI 과제를 정합니다." },
  { key: "plan_90d", title: "90일 계획", hint: "앞으로 90일간 실행할 구체 계획입니다. (결과물 근거를 첨부할 수 있습니다.)" },
  { key: "expansion", title: "확산 계획", hint: "조직 전체로 확산하는 계획입니다." },
];

const SAMPLE: Record<StepKey, string> = {
  diagnosis:
    "현재 사내 AI 활용은 개별 직원 단위의 챗봇 사용에 머물러 있으며, 부서 간 표준 프로세스가 없습니다. 반복 업무의 자동화 수준은 낮고, 데이터가 여러 시스템에 흩어져 있어 통합 분석이 어렵습니다.",
  priorities:
    "1) 고객 문의 응대 자동화\n2) 내부 문서 검색·요약 체계 구축\n3) 신규 입사자 온보딩 자료의 AI 기반 정리\n투자 대비 효과가 크고 실행 난이도가 낮은 과제부터 착수합니다.",
  plan_90d:
    "1~30일: 현황 진단 및 파일럿 부서 선정\n31~60일: 문의 응대 챗봇 프로토타입 구축 및 테스트\n61~90일: 파일럿 결과 측정, 전사 확산 여부 결정 보고",
  expansion:
    "파일럿 성공 지표(응대 시간 30% 단축)를 달성하면 전사 5개 부서로 순차 확산하고, 사내 AI 활용 가이드라인을 제정해 전 직원 교육을 진행합니다.",
};

export function RoadmapView({ userId, cohortId }: { userId: string; cohortId: string | null }) {
  const [fields, setFields] = useState<Record<StepKey, string>>({
    diagnosis: "",
    priorities: "",
    plan_90d: "",
    expansion: "",
  });
  const [status, setStatus] = useState<RoadmapStatus>("draft");
  const [buildIds, setBuildIds] = useState<string[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [showBuildPicker, setShowBuildPicker] = useState(false);
  const [presentOpen, setPresentOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const skipFirstSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const sb = getSupabaseBrowser();
      const [{ data: roadmap, error: rErr }, { data: buildRows, error: bErr }] = await Promise.all([
        sb.from("roadmaps").select("*").eq("user_id", userId).maybeSingle(),
        sb.from("builds").select("id,title").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);
      if (rErr) throw rErr;
      if (bErr) throw bErr;
      const row = roadmap as RoadmapRow | null;
      if (row) {
        setFields({
          diagnosis: row.diagnosis ?? "",
          priorities: row.priorities ?? "",
          plan_90d: row.plan_90d ?? "",
          expansion: row.expansion ?? "",
        });
        setStatus(row.status);
        setBuildIds(row.build_ids ?? []);
      }
      setBuilds((buildRows as Build[]) ?? []);
    } catch {
      // 스키마 미적용 대비 — 기존 화면과 동일한 방어 패턴
    } finally {
      setLoaded(true);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    setSavedAt(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void save();
    }, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, status, buildIds, loaded]);

  useEffect(() => {
    if (!presentOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setSlideIndex((i) => Math.min(STEPS.length - 1, i + 1));
      else if (e.key === "ArrowLeft") setSlideIndex((i) => Math.max(0, i - 1));
      else if (e.key === "Escape") setPresentOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presentOpen]);

  async function save() {
    try {
      const sb = getSupabaseBrowser();
      const { error } = await sb.from("roadmaps").upsert(
        {
          user_id: userId,
          cohort_id: cohortId,
          diagnosis: fields.diagnosis,
          priorities: fields.priorities,
          plan_90d: fields.plan_90d,
          expansion: fields.expansion,
          build_ids: buildIds,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      setSavedAt(Date.now());
    } catch {
      // 저장 실패 시 다음 입력에서 다시 시도
    }
  }

  function updateField(key: StepKey, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function toggleBuild(id: string) {
    setBuildIds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  }

  function removeBuild(id: string) {
    setBuildIds((prev) => prev.filter((b) => b !== id));
  }

  function loadSample() {
    setFields(SAMPLE);
  }

  const isEmpty = !fields.diagnosis && !fields.priorities && !fields.plan_90d && !fields.expansion;

  return (
    <PortalShell title="AX 로드맵">
      <div className="mx-auto max-w-[760px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MapIcon size={22} className="text-primary" />
              <SectionTitle>AX 로드맵</SectionTitle>
            </div>
            <p className="mt-1 text-sm text-muted">
              현황 진단부터 확산 계획까지 4단계로 작성하고, 발표 모드로 바로 공유합니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-full bg-surface-muted p-1">
              <button
                type="button"
                onClick={() => setStatus("draft")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium text-muted transition-colors",
                  status === "draft" && "bg-surface font-semibold text-ink shadow-sm",
                )}
              >
                초안
              </button>
              <button
                type="button"
                onClick={() => setStatus("final")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium text-muted transition-colors",
                  status === "final" && "bg-surface font-semibold text-ink shadow-sm",
                )}
              >
                발표본
              </button>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setSlideIndex(0);
                setPresentOpen(true);
              }}
            >
              발표 모드
            </Button>
          </div>
        </div>

        {savedAt ? <p className="mt-2 text-xs text-muted">✓ 자동 저장됨 · 방금</p> : null}

        {loaded && isEmpty ? (
          <Card className="mt-5 border-dashed text-center">
            <p className="text-sm text-muted">아직 작성한 로드맵이 없습니다. 샘플로 감을 잡아 보세요.</p>
            <Button variant="outline" className="mt-3" onClick={loadSample}>
              익명화 샘플 로드맵 불러오기
            </Button>
          </Card>
        ) : null}

        {STEPS.map((step, idx) => (
          <Card key={step.key} className="mt-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-white">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{step.title}</p>
                <p className="text-xs text-muted">{step.hint}</p>
                <Textarea
                  rows={4}
                  className="mt-2"
                  value={fields[step.key]}
                  onChange={(e) => updateField(step.key, e.target.value)}
                />

                {step.key === "plan_90d" ? (
                  <div className="mt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {buildIds.map((id) => {
                        const build = builds.find((b) => b.id === id);
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 rounded-full border border-cardline bg-surface px-2.5 py-1 text-xs text-ink"
                          >
                            {build?.title ?? "삭제된 결과물"}
                            <button
                              type="button"
                              onClick={() => removeBuild(id)}
                              aria-label="첨부 제거"
                              className="text-muted hover:text-danger"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setShowBuildPicker((v) => !v)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        + Build 근거 첨부
                      </button>
                    </div>

                    {showBuildPicker ? (
                      builds.length === 0 ? (
                        <div className="mt-2">
                          <p className="text-xs text-muted">첨부할 결과물이 아직 없습니다.</p>
                          <Button variant="ghost" href="/portal/builds" className="mt-1">
                            결과물 만들러 가기
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {builds.map((b) => (
                            <Chip key={b.id} active={buildIds.includes(b.id)} onClick={() => toggleBuild(b.id)}>
                              {b.title}
                            </Chip>
                          ))}
                        </div>
                      )
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {presentOpen ? (
        <div className="fixed inset-0 z-50 flex bg-[#000] text-white">
          <button
            type="button"
            onClick={() => setPresentOpen(false)}
            className="absolute right-6 top-6 rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
          >
            나가기 ✕
          </button>

          <div className="flex w-[220px] shrink-0 flex-col gap-1 border-r border-white/15 p-6">
            <p className="mb-4 text-xs tracking-widest text-white/40">AX 로드맵</p>
            {STEPS.map((step, idx) => (
              <button
                key={step.key}
                type="button"
                onClick={() => setSlideIndex(idx)}
                className={cn(
                  "rounded-control px-3 py-2 text-left text-sm transition-colors",
                  idx === slideIndex ? "bg-white/10 font-semibold text-white" : "text-white/60 hover:text-white",
                )}
              >
                {step.title}
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-col justify-center px-16">
            <p className="text-xs tracking-widest text-white/50">
              STEP {slideIndex + 1} / {STEPS.length}
            </p>
            <h1 className="mt-4 text-4xl font-semibold">{STEPS[slideIndex].title}</h1>
            <p className="mt-6 max-w-[820px] whitespace-pre-wrap text-xl leading-relaxed text-white/80">
              {fields[STEPS[slideIndex].key] || "작성된 내용이 없습니다."}
            </p>
          </div>

          <div className="absolute bottom-8 right-10 flex items-center gap-3">
            <span className="text-sm text-white/50">
              {slideIndex + 1} / {STEPS.length}
            </span>
            <button
              type="button"
              onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
              disabled={slideIndex === 0}
              aria-label="이전 슬라이드"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => setSlideIndex((i) => Math.min(STEPS.length - 1, i + 1))}
              disabled={slideIndex === STEPS.length - 1}
              aria-label="다음 슬라이드"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      ) : null}
    </PortalShell>
  );
}
