"use client";

import { useMemo, useState } from "react";
import { Archive, FileText, Lock, PlayCircle, Newspaper } from "lucide-react";
import { AlumniShell } from "@/components/alumni-shell";
import { Badge, Button, Card, CardTitle, Callout, Chip, SectionTitle } from "@/components/ui";

// Design Ref: prd-v30-remaining.design.md §4 F6 — SCR-09.
// v2.4 확정: 멤버십 active = 과거 전 기수 read-only. 진행 중 기수는 종료 후 공개.

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

export function ArchiveView({ cohorts, sessions }: { cohorts: ArchiveCohort[]; sessions: ArchiveSession[] }) {
  const cohortsWithContent = useMemo(
    () => cohorts.filter((c) => sessions.some((s) => s.cohort_id === c.id)),
    [cohorts, sessions],
  );
  const [selectedId, setSelectedId] = useState<string | null>(cohortsWithContent[0]?.id ?? null);

  const selected = cohortsWithContent.find((c) => c.id === selectedId) ?? null;
  const ongoing = selected ? isOngoing(selected) : false;
  const list = sessions.filter((s) => s.cohort_id === selectedId);

  return (
    <AlumniShell>
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-info-surface text-primary">
          <Archive size={20} />
        </span>
        <div>
          <SectionTitle>전 기수 아카이브</SectionTitle>
          <p className="text-sm text-muted">멤버십 혜택 — 모든 기수의 녹화본·교재를 다시 볼 수 있습니다.</p>
        </div>
      </div>

      {/* 의사결정 브리프 진입점 (SCR-09 ③) */}
      <Callout className="mt-5 items-center justify-between">
        <span className="flex items-center gap-2">
          <Newspaper size={15} className="shrink-0" />
          빠르게 낡는 AI 지식, 의사결정 브리프로 계속 업데이트하세요.
        </span>
        <Button href="/trends" variant="outline" className="shrink-0 !min-h-8 !px-3 !text-xs">
          브리프 보기
        </Button>
      </Callout>

      {cohortsWithContent.length === 0 ? (
        <Card className="mt-5">
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Archive size={26} className="text-faint" />
            <p className="text-sm font-semibold text-ink">아직 공개된 아카이브가 없습니다</p>
            <p className="text-[13px] text-muted">기수가 종료되면 녹화본과 교재가 이곳에 공개됩니다.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* 기수 필터 */}
          <div className="mt-6 flex flex-wrap gap-2">
            {cohortsWithContent.map((c) => (
              <Chip key={c.id} active={c.id === selectedId} onClick={() => setSelectedId(c.id)}>
                {c.name}
                {isOngoing(c) ? " · 진행 중" : ""}
              </Chip>
            ))}
          </div>

          {ongoing ? (
            <Callout className="mt-4">
              <Lock size={15} className="mt-0.5 shrink-0" />
              진행 중인 기수의 콘텐츠는 해당 기수 종료 후 공개됩니다. 지금은 세션 목록만
              보여드립니다.
            </Callout>
          ) : null}

          <div className="mt-5 space-y-4">
            {list.map((s) => (
              <Card key={s.id}>
                <div className="flex flex-wrap items-center gap-2">
                  {typeof s.week_no === "number" && s.week_no > 0 ? (
                    <Badge tone="info">{s.week_no}주차</Badge>
                  ) : (
                    <Badge tone="neutral">보충</Badge>
                  )}
                  <CardTitle>{s.title}</CardTitle>
                </div>

                {ongoing ? (
                  <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted">
                    <Lock size={13} /> 기수 종료 후 공개
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
    </AlumniShell>
  );
}
