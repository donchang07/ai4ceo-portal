"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, FileText, Lock, PlayCircle } from "lucide-react";
import { AlumniShell } from "@/components/alumni-shell";
import { Badge, Button, Callout, Card, CardTitle, Chip, SectionTitle } from "@/components/ui";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";
import { MEMBERSHIP_KRW, formatKRW } from "@/lib/core/constants";

// prd-v30-final §3 F2 — 기수·주차별 녹화본·교재 (SCR-09, US-10)
export interface ArchiveCohort {
  id: string;
  name: string;
  edu_start: string | null;
  edu_end: string | null;
  status: string | null;
}

export interface ArchiveSession {
  id: string;
  cohort_id: string;
  week_no: number | null;
  title: string;
  starts_at: string | null;
  type: string | null;
  videos: { id: string; session_id: string; title: string | null; google_drive_url: string | null }[];
  materials: { id: string; session_id: string; title: string; file_path: string | null; version: number | null }[];
}

function isOngoing(c: ArchiveCohort): boolean {
  if (c.edu_end) return new Date(c.edu_end).getTime() > Date.now();
  return c.status === "active";
}

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

export function ArchiveView({
  hasActiveMembership,
  canReadArchive,
  cohorts = [],
  sessions = [],
}: {
  hasActiveMembership: boolean;
  canReadArchive: boolean;
  cohorts?: ArchiveCohort[];
  sessions?: ArchiveSession[];
}) {
  const [posts, setPosts] = useState<ArchivePost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cohortFilter, setCohortFilter] = useState<CohortFilter>("전체");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("전체");

  // 녹화본·교재 섹션 전용 기수 필터 — 실제 DB 기수를 사용(위 브리프 필터는 정적 목록 그대로 승계)
  const cohortsWithContent = useMemo(
    () => cohorts.filter((c) => sessions.some((s) => s.cohort_id === c.id)),
    [cohorts, sessions],
  );
  const [recordingCohortId, setRecordingCohortId] = useState<string | null>(cohortsWithContent[0]?.id ?? null);
  const selectedCohort = cohortsWithContent.find((c) => c.id === recordingCohortId) ?? null;
  const cohortOngoing = selectedCohort ? isOngoing(selectedCohort) : false;
  const sessionList = sessions.filter((s) => s.cohort_id === recordingCohortId);

  const load = useCallback(async () => {
    try {
      const sb = getSupabaseBrowser();
      const { data, error } = canReadArchive
        ? await sb
            .from("posts")
            .select("id,board,cohort_id,title,external_url,category,tags,audience,published_at")
            .in("board", ["brief", "ai_trend"])
            .order("published_at", { ascending: false })
        : await sb.rpc("list_locked_archive_metadata");
      if (error) throw error;
      setPosts(
        ((data ?? []) as Partial<ArchivePost>[]).map((post) => ({
          id: post.id!,
          board: post.board ?? "brief",
          cohort_id: post.cohort_id ?? null,
          title: post.title!,
          excerpt: null,
          thumbnail_path: null,
          external_url: canReadArchive ? post.external_url ?? null : null,
          category: post.category ?? null,
          tags: post.tags ?? null,
          audience: post.audience ?? "alumni",
          published_at: post.published_at!,
        })),
      );
    } catch {
      setPosts([]);
    } finally {
      setLoaded(true);
    }
  }, [canReadArchive]);

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
        {canReadArchive ? (
          <Badge tone="info">{hasActiveMembership ? "멤버십 이용 중" : "관리자 열람"}</Badge>
        ) : (
          <Badge tone="neutral">멤버십 만료</Badge>
        )}
      </div>

      {!canReadArchive ? (
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
              {canReadArchive ? (
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

      {/* 녹화본·교재 (SCR-09 — US-10) */}
      <div className="mt-10 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-info-surface text-primary">
          <Archive size={18} />
        </span>
        <SectionTitle className="!text-lg">전 기수 녹화본·교재</SectionTitle>
      </div>

      {cohortsWithContent.length === 0 ? (
        <Card className="mt-4">
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Archive size={22} className="text-faint" />
            <p className="text-sm font-semibold text-ink">아직 공개된 녹화본·교재가 없습니다</p>
            <p className="text-[13px] text-muted">기수가 종료되면 이곳에 공개됩니다.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {cohortsWithContent.map((c) => (
              <Chip key={c.id} active={c.id === recordingCohortId} onClick={() => setRecordingCohortId(c.id)}>
                {c.name}
                {isOngoing(c) ? " · 진행 중" : ""}
              </Chip>
            ))}
          </div>

          {cohortOngoing ? (
            <Callout className="mt-4">
              <Lock size={15} className="mt-0.5 shrink-0" />
              진행 중인 기수의 콘텐츠는 종료 후 공개됩니다. 지금은 세션 목록만 보여드립니다.
            </Callout>
          ) : null}

          <div className="mt-4 space-y-4">
            {sessionList.map((s) => (
              <Card key={s.id}>
                <div className="flex flex-wrap items-center gap-2">
                  {typeof s.week_no === "number" && s.week_no > 0 ? (
                    <Badge tone="info">{s.week_no}주차</Badge>
                  ) : (
                    <Badge tone="neutral">보충</Badge>
                  )}
                  <CardTitle>{s.title}</CardTitle>
                </div>

                {cohortOngoing ? (
                  <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted">
                    <Lock size={13} /> 기수 종료 후 공개
                  </p>
                ) : !hasActiveMembership ? (
                  <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted">
                    <Lock size={13} /> 멤버십 갱신 후 재생·다운로드 가능
                  </p>
                ) : (
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-muted">녹화 영상</p>
                      {s.videos.length === 0 ? (
                        <p className="mt-1.5 text-[13px] text-faint">등록된 영상 없음</p>
                      ) : (
                        <ul className="mt-1.5 space-y-1.5">
                          {s.videos.map((v) => (
                            <li key={v.id}>
                              <a
                                href={v.google_drive_url ?? "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                <PlayCircle size={15} className="shrink-0" />
                                {v.title ?? "녹화 영상"}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted">교재·자료</p>
                      {s.materials.length === 0 ? (
                        <p className="mt-1.5 text-[13px] text-faint">등록된 자료 없음</p>
                      ) : (
                        <ul className="mt-1.5 space-y-1.5">
                          {s.materials.map((m) => (
                            <li key={m.id}>
                              <a
                                href={m.file_path ?? "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-ink hover:text-primary"
                              >
                                <FileText size={15} className="shrink-0 text-info" />
                                <span className="truncate">{m.title}</span>
                                {m.version ? <span className="tnum text-xs text-muted">v{m.version}</span> : null}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

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
