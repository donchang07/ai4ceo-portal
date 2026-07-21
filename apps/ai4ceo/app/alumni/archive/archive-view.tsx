"use client";

import { useCallback, useEffect, useState } from "react";
import { AlumniShell } from "@/components/alumni-shell";
import { Badge, Button, Callout, Card, CardTitle, Chip, SectionTitle } from "@/components/ui";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";
import { MEMBERSHIP_KRW, formatKRW } from "@/lib/core/constants";

interface ArchivePost {
  id: string;
  board: "notice" | "qna" | "as_qna" | "brief" | "ai_trend";
  cohort_id: string | null;
  title: string;
  excerpt: string | null;
  thumbnail_path: string | null;
  external_url: string | null;
  category: string | null;
  tags: string[] | null;
  audience: "public" | "student" | "alumni" | "admin_only";
  published_at: string;
}

type ArchiveItem = ArchivePost & { type: "브리프" };

const COHORT_FILTERS = ["전체", "17기", "16기", "15기"] as const;
type CohortFilter = (typeof COHORT_FILTERS)[number];

const TYPE_FILTERS = ["전체", "브리프"] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

export function ArchiveView({ hasActiveMembership }: { hasActiveMembership: boolean }) {
  const [posts, setPosts] = useState<ArchivePost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cohortFilter, setCohortFilter] = useState<CohortFilter>("전체");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("전체");

  const load = useCallback(async () => {
    try {
      const sb = getSupabaseBrowser();
      const { data, error } = await sb
        .from("posts")
        .select("*")
        .in("board", ["brief", "ai_trend"])
        .order("published_at", { ascending: false });
      if (error) throw error;
      setPosts((data as ArchivePost[]) ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items: ArchiveItem[] = posts.map((p) => ({ ...p, type: "브리프" as const }));

  const filtered = items.filter((item) => {
    const cohortOk =
      cohortFilter === "전체" ||
      item.category === cohortFilter ||
      (item.tags?.includes(cohortFilter) ?? false);
    const typeOk = typeFilter === "전체" || typeFilter === item.type;
    return cohortOk && typeOk;
  });

  return (
    <AlumniShell>
      <div className="flex items-center justify-between gap-2">
        <SectionTitle>동문 아카이브</SectionTitle>
        {hasActiveMembership ? (
          <Badge tone="info">멤버십 이용 중</Badge>
        ) : (
          <Badge tone="neutral">멤버십 만료</Badge>
        )}
      </div>

      {!hasActiveMembership ? (
        <Card className="mt-4 bg-ink text-white">
          <p className="text-sm">
            멤버십이 만료되었습니다 — 목록은 보이지만 재생·다운로드는 잠깁니다. 연 {formatKRW(MEMBERSHIP_KRW)}.
          </p>
          <div className="mt-3">
            <Button variant="primary" href="/alumni/membership">
              멤버십 갱신
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="mt-4">
        <Callout>📌 진행 중인 18기 콘텐츠는 기수 종료 후 공개됩니다.</Callout>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {COHORT_FILTERS.map((c) => (
          <Chip key={c} active={cohortFilter === c} onClick={() => setCohortFilter(c)}>
            {c}
          </Chip>
        ))}
        <span className="mx-1 h-5 w-px bg-cardline" />
        {TYPE_FILTERS.map((t) => (
          <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id}>
            <Badge tone="info">브리프</Badge>
            <p className="mt-2 font-semibold text-ink">{item.title}</p>
            <p className="mt-1 text-xs text-muted">
              {new Date(item.published_at).toLocaleDateString("ko-KR")}
              {item.category ? ` · ${item.category}` : ""}
            </p>
            <div className="mt-3">
              {hasActiveMembership ? (
                <Button variant="outline" href={item.external_url ?? "#"}>
                  읽기
                </Button>
              ) : (
                <span className="text-xs text-muted">🔒 갱신 후 이용 가능</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {loaded && items.length === 0 ? (
        <Card className="mt-4">
          <p className="text-sm text-muted">
            아직 공개된 아카이브 콘텐츠가 없습니다. 기수 종료 후 순차 공개됩니다.
          </p>
        </Card>
      ) : null}

      <Card className="mt-8 bg-ink text-white">
        <CardTitle className="text-white">의사결정 브리프</CardTitle>
        <p className="mt-1 text-sm text-white/70">격주로 발송되는 CEO 의사결정 브리프</p>
        <div className="mt-3">
          <Button variant="secondary" href="/trends">
            구독 관리
          </Button>
        </div>
      </Card>
    </AlumniShell>
  );
}
