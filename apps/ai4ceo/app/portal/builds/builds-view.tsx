"use client";

import { useState } from "react";
import { Hammer, Plus, Globe, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Button, Card, CardTitle, Callout, Chip, Input, SectionTitle, Textarea, type Tone } from "@/components/ui";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";
import { cn } from "@/lib/core/cn";

// Design Ref: prd-v30-remaining.design.md §4 F3 — SCR-05 (US-06 ROI 증명)

export interface BuildRow {
  id: string;
  title: string | null;
  description: string | null;
  repo_url: string | null;
  apply_status: string | null;
  effect_memo: string | null;
  visibility: string | null;
  created_at: string;
}

const APPLY_STEPS: { value: string; label: string; tone: Tone }[] = [
  { value: "none", label: "미기록", tone: "neutral" },
  { value: "review", label: "검토 중", tone: "wait" },
  { value: "pilot", label: "파일럿", tone: "progress" },
  { value: "applied", label: "적용 완료", tone: "done" },
];

function applyMeta(status: string | null) {
  return APPLY_STEPS.find((s) => s.value === (status ?? "none")) ?? APPLY_STEPS[0];
}

export function BuildsView({ userId, initialBuilds }: { userId: string; initialBuilds: BuildRow[] }) {
  const [builds, setBuilds] = useState<BuildRow[]>(initialBuilds);
  const [showForm, setShowForm] = useState(initialBuilds.length === 0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 등록 폼 상태
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  async function createBuild() {
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const sb = getSupabaseBrowser();
      const { data, error: err } = await sb
        .from("builds")
        .insert({
          user_id: userId,
          title: title.trim(),
          description: description.trim() || null,
          repo_url: repoUrl.trim() || null,
        })
        .select("id, title, description, repo_url, apply_status, effect_memo, visibility, created_at")
        .single();
      if (err) throw err;
      setBuilds((prev) => [data as BuildRow, ...prev]);
      setTitle("");
      setDescription("");
      setRepoUrl("");
      setShowForm(false);
    } catch {
      setError("등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function patchBuild(id: string, patch: Partial<Pick<BuildRow, "apply_status" | "effect_memo" | "visibility">>) {
    setBusy(true);
    setError(null);
    try {
      const sb = getSupabaseBrowser();
      const { error: err } = await sb.from("builds").update(patch).eq("id", id);
      if (err) throw err;
      setBuilds((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    } catch {
      setError("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortalShell title="내 결과물">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <SectionTitle>내 결과물 (Build)</SectionTitle>
          <p className="mt-1 text-sm text-muted">
            만든 것을 기록하고, 회사 적용 여부와 효과까지 추적하세요. 이 기록이 곧 ROI의
            근거가 됩니다.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> 결과물 등록
        </Button>
      </div>

      {error ? <Callout className="mb-4 !text-danger">{error}</Callout> : null}

      {showForm ? (
        <Card className="mb-5">
          <CardTitle>새 결과물 등록</CardTitle>
          <div className="mt-4 space-y-3">
            <Input placeholder="제목 (예: 주간 매출 대시보드)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea
              rows={3}
              placeholder="무엇을, 왜 만들었나요? 어떤 업무가 어떻게 달라졌나요?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input placeholder="데모 또는 저장소 URL (선택)" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="primary" onClick={createBuild} disabled={busy}>
                등록
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                취소
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {builds.length === 0 && !showForm ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-info-surface text-primary">
              <Hammer size={22} />
            </span>
            <p className="text-sm font-semibold text-ink">아직 등록된 결과물이 없습니다</p>
            <p className="max-w-sm text-[13px] text-muted">
              과정 중 만든 도구·앱·자동화를 등록해 보세요. 작은 것부터 기록하면 수료 발표와
              AX 로드맵의 재료가 됩니다.
            </p>
            <Button variant="primary" onClick={() => setShowForm(true)}>
              첫 결과물 등록하기
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="space-y-4">
        {builds.map((b) => {
          const meta = applyMeta(b.apply_status);
          const isOpen = expanded === b.id;
          const isPublic = b.visibility === "public";
          return (
            <Card key={b.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{b.title ?? "무제"}</span>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    {isPublic ? <Badge tone="info">공개</Badge> : null}
                  </div>
                  {b.description ? (
                    <p className={cn("mt-1.5 text-[13px] text-muted", !isOpen && "line-clamp-2")}>{b.description}</p>
                  ) : null}
                  {b.repo_url ? (
                    <a href={b.repo_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
                      {b.repo_url}
                    </a>
                  ) : null}
                </div>
                <Button variant="ghost" onClick={() => setExpanded(isOpen ? null : b.id)} aria-label="상세">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
              </div>

              {isOpen ? (
                <div className="mt-4 border-t border-hairline pt-4">
                  {/* 적용 추적 (SCR-05 ③) */}
                  <p className="text-xs font-semibold text-muted">회사 적용 상태</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {APPLY_STEPS.map((s) => (
                      <Chip
                        key={s.value}
                        active={(b.apply_status ?? "none") === s.value}
                        onClick={() => patchBuild(b.id, { apply_status: s.value })}
                        disabled={busy}
                      >
                        {s.label}
                      </Chip>
                    ))}
                  </div>

                  <p className="mt-4 text-xs font-semibold text-muted">효과 메모 (시간 절감·비용·매출 등)</p>
                  <EffectMemo
                    key={b.id + (b.effect_memo ?? "")}
                    initial={b.effect_memo ?? ""}
                    onSave={(memo) => patchBuild(b.id, { effect_memo: memo || null })}
                    busy={busy}
                  />

                  {/* 공개 동의 (SCR-05 ④) */}
                  <div className="mt-4 flex items-center justify-between rounded-[12px] border border-cardline bg-canvas px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-ink">
                      {isPublic ? <Globe size={15} className="text-primary" /> : <Lock size={15} className="text-muted" />}
                      <span>{isPublic ? "과정 안내 페이지에 공개 중" : "기수 내부에만 공개"}</span>
                    </div>
                    <Button
                      variant={isPublic ? "ghost" : "outline"}
                      onClick={() => patchBuild(b.id, { visibility: isPublic ? "cohort" : "public" })}
                      disabled={busy}
                    >
                      {isPublic ? "공개 철회" : "공개 동의"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </PortalShell>
  );
}

function EffectMemo({ initial, onSave, busy }: { initial: string; onSave: (memo: string) => void; busy: boolean }) {
  const [memo, setMemo] = useState(initial);
  const dirty = memo !== initial;
  return (
    <div className="mt-2">
      <Textarea
        rows={2}
        placeholder="예: 주간 보고 취합 2시간 → 10분. 월 인건비 환산 약 80만원 절감."
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
      />
      {dirty ? (
        <Button variant="secondary" className="mt-2" onClick={() => onSave(memo.trim())} disabled={busy}>
          메모 저장
        </Button>
      ) : null}
    </div>
  );
}
