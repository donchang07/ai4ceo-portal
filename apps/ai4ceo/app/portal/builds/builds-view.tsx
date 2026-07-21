"use client";

import { useCallback, useEffect, useState } from "react";
import { Hammer, Plus } from "lucide-react";
import { z } from "zod";
import { PortalShell } from "@/components/portal-shell";
import { Badge, Button, Card, CardTitle, Chip, Input, SectionTitle, Textarea } from "@/components/ui";
import { cn } from "@/lib/core/cn";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";

type ApplyStatus = "none" | "review" | "pilot" | "applied";

interface Build {
  id: string;
  user_id: string;
  cohort_id: string | null;
  title: string | null;
  description: string | null;
  media_path: string | null;
  repo_url: string | null;
  stage: string;
  applied_to_company: boolean;
  visibility: string;
  created_at: string;
  apply_status: ApplyStatus;
  effect_memo: string | null;
}

const createSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요."),
  description: z.string().trim(),
  repoUrl: z.string().trim(),
});

const APPLY_STATUS_META: Record<ApplyStatus, { label: string; tone: "neutral" | "wait" | "info" | "done" }> = {
  none: { label: "미정", tone: "neutral" },
  review: { label: "검토중", tone: "wait" },
  pilot: { label: "파일럿", tone: "info" },
  applied: { label: "적용완료", tone: "done" },
};

const APPLY_CHIPS: { value: ApplyStatus; label: string }[] = [
  { value: "review", label: "검토중" },
  { value: "pilot", label: "파일럿" },
  { value: "applied", label: "적용완료" },
];

export function BuildsView({ userId, cohortId }: { userId: string; cohortId: string | null }) {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [effectMemoDraft, setEffectMemoDraft] = useState("");

  const load = useCallback(async () => {
    try {
      const sb = getSupabaseBrowser();
      const { data, error: selError } = await sb
        .from("builds")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (selError) throw selError;
      setBuilds((data as Build[]) ?? []);
    } catch {
      setBuilds([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedBuild = builds.find((b) => b.id === selectedId) ?? null;

  useEffect(() => {
    setEffectMemoDraft(selectedBuild?.effect_memo ?? "");
  }, [selectedBuild?.id, selectedBuild?.effect_memo]);

  async function create() {
    const parsed = createSchema.safeParse({ title, description, repoUrl });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력을 확인해 주세요.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const sb = getSupabaseBrowser();
      const { error: insError } = await sb.from("builds").insert({
        user_id: userId,
        cohort_id: cohortId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        repo_url: parsed.data.repoUrl || null,
        apply_status: "none",
      });
      if (insError) throw insError;
      setTitle("");
      setDescription("");
      setRepoUrl("");
      setShowCreate(false);
      await load();
    } catch {
      setError("등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function updateApplyStatus(id: string, applyStatus: ApplyStatus) {
    try {
      const sb = getSupabaseBrowser();
      const { error: updError } = await sb.from("builds").update({ apply_status: applyStatus }).eq("id", id);
      if (updError) throw updError;
      setBuilds((prev) => prev.map((b) => (b.id === id ? { ...b, apply_status: applyStatus } : b)));
    } catch {
      setError("적용 상태 변경에 실패했습니다.");
    }
  }

  async function saveEffectMemo(id: string) {
    setBusy(true);
    try {
      const sb = getSupabaseBrowser();
      const { error: updError } = await sb.from("builds").update({ effect_memo: effectMemoDraft || null }).eq("id", id);
      if (updError) throw updError;
      setBuilds((prev) => prev.map((b) => (b.id === id ? { ...b, effect_memo: effectMemoDraft || null } : b)));
    } catch {
      setError("효과 메모 저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility(id: string, current: string) {
    const next = current === "public" ? "cohort" : "public";
    try {
      const sb = getSupabaseBrowser();
      const { error: updError } = await sb.from("builds").update({ visibility: next }).eq("id", id);
      if (updError) throw updError;
      setBuilds((prev) => prev.map((b) => (b.id === id ? { ...b, visibility: next } : b)));
    } catch {
      setError("공개 설정 변경에 실패했습니다.");
    }
  }

  return (
    <PortalShell title="결과물">
      <div className="mx-auto max-w-[960px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Hammer size={22} className="text-primary" />
              <SectionTitle>결과물</SectionTitle>
            </div>
            <p className="mt-1 text-sm text-muted">
              만든 결과물을 회사에 적용하고 그 효과까지 기록해, ROI를 스스로 증명할 데이터를 쌓습니다.
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowCreate((v) => !v)}>
            <Plus size={16} /> 결과물 등록
          </Button>
        </div>

        {showCreate ? (
          <Card className="mt-5">
            <CardTitle>새 결과물</CardTitle>
            <div className="mt-3 flex flex-col gap-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="결과물 제목" />
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="설명 (선택)" />
              <Input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="레포/링크 URL (선택)" />
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <Button variant="primary" onClick={create} disabled={busy}>
                <Plus size={16} /> 등록하기
              </Button>
            </div>
          </Card>
        ) : null}

        {loaded && builds.length === 0 ? (
          <Card className="mt-6 border-dashed">
            <p className="text-sm font-medium text-ink">아직 등록한 결과물이 없습니다</p>
            <p className="mt-1 text-sm text-muted">
              스크린샷 한 장이면 충분합니다 — 10주차 AX 로드맵의 근거가 됩니다.
            </p>
            <div className="mt-3">
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                <Plus size={16} /> 결과물 등록
              </Button>
            </div>
          </Card>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {builds.map((build) => {
            const meta = APPLY_STATUS_META[build.apply_status];
            const selected = build.id === selectedId;
            return (
              <button
                key={build.id}
                type="button"
                onClick={() => setSelectedId(selected ? null : build.id)}
                className={cn(
                  "rounded-[15px] border border-hairline bg-surface p-4 text-left transition-colors",
                  selected && "ring-2 ring-primary",
                )}
              >
                <div className="h-32 rounded-[11px] bg-surface-muted" />
                <p className="mt-3 truncate font-semibold text-ink">{build.title ?? "제목 없음"}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted">{new Date(build.created_at).toLocaleDateString("ko-KR")}</span>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
              </button>
            );
          })}
        </div>

        {selectedBuild ? (
          <Card className="mt-6">
            <CardTitle>{selectedBuild.title ?? "제목 없음"}</CardTitle>

            <div className="mt-4">
              <p className="text-sm font-medium text-ink">적용 상태 선택</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {APPLY_CHIPS.map((chip) => (
                  <Chip
                    key={chip.value}
                    active={selectedBuild.apply_status === chip.value}
                    onClick={() => updateApplyStatus(selectedBuild.id, chip.value)}
                  >
                    {chip.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-ink">효과 메모</p>
              <Textarea
                className="mt-2"
                rows={3}
                value={effectMemoDraft}
                onChange={(e) => setEffectMemoDraft(e.target.value)}
                placeholder="시간·비용·매출 등 회사 적용 효과를 자유롭게 적어 주세요."
              />
              <div className="mt-2">
                <Button variant="outline" onClick={() => saveEffectMemo(selectedBuild.id)} disabled={busy}>
                  저장
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-ink">SCR-01 미리보기·수료 발표에 공개</span>
              <button
                type="button"
                role="switch"
                aria-checked={selectedBuild.visibility === "public"}
                onClick={() => toggleVisibility(selectedBuild.id, selectedBuild.visibility)}
                className={cn(
                  "relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors",
                  selectedBuild.visibility === "public" ? "bg-primary" : "bg-cardline",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-[26px] w-[26px] rounded-full bg-white transition-transform",
                    selectedBuild.visibility === "public" ? "translate-x-[22px]" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>

            {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

            <p className="mt-4 text-xs text-muted">
              적용 데이터는 90일 성과설문·10주차 AX 로드맵의 근거로 연결됩니다.
            </p>
          </Card>
        ) : null}
      </div>
    </PortalShell>
  );
}
