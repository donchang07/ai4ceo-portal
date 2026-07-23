"use client";

import { useMemo, useState } from "react";
import { Users, Building2, ExternalLink } from "lucide-react";
import { AlumniShell } from "@/components/alumni-shell";
import { Badge, Card, CardTitle, Chip, SectionTitle } from "@/components/ui";

// Design Ref: prd-v3-cycle5.design.md §4 — alumni_profiles 단일 테이블만 사용(비정규화 표시 필드).

export interface DirectoryRow {
  user_id: string;
  display_name: string | null;
  job_title: string | null;
  company_name: string | null;
  bio: string | null;
  expertise: string | null;
  cohort_label: string | null;
  homepage_url: string | null;
}

export function DirectoryView({ rows }: { rows: DirectoryRow[] }) {
  const [cohortFilter, setCohortFilter] = useState<string>("전체");

  const cohorts = useMemo(() => {
    const set = new Set(rows.map((r) => r.cohort_label).filter((v): v is string => Boolean(v)));
    return ["전체", ...Array.from(set).sort()];
  }, [rows]);

  const filtered = rows.filter((r) => cohortFilter === "전체" || r.cohort_label === cohortFilter);

  return (
    <AlumniShell>
      <div className="flex items-center gap-2">
        <Users size={22} className="text-primary" />
        <SectionTitle>동문 디렉토리</SectionTitle>
      </div>
      <p className="mt-1.5 text-sm text-muted">
        프로필 공개를 선택한 동문만 표시됩니다. 협업이나 자문이 필요하면 프로필에서 연락
        관심사를 확인해 보세요.
      </p>

      {cohorts.length > 1 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {cohorts.map((c) => (
            <Chip key={c} active={cohortFilter === c} onClick={() => setCohortFilter(c)}>
              {c}
            </Chip>
          ))}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <Card className="mt-6">
          <p className="py-10 text-center text-sm text-muted">
            아직 프로필을 공개한 동문이 없습니다. 가장 먼저 공개해 보세요.
          </p>
        </Card>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <a key={r.user_id} href={`/alumni/${r.user_id}`} className="block">
              <Card className="h-full transition-shadow hover:shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{r.display_name ?? "동문"}</span>
                  {r.cohort_label ? <Badge tone="neutral">{r.cohort_label}</Badge> : null}
                </div>
                {r.job_title || r.company_name ? (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <Building2 size={12} />
                    {[r.job_title, r.company_name].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {r.bio ? <p className="mt-2 line-clamp-2 text-[13px] text-muted">{r.bio}</p> : null}
                {r.expertise ? (
                  <p className="mt-2 text-xs font-medium text-primary">#{r.expertise}</p>
                ) : null}
                {r.homepage_url ? (
                  <span className="mt-2 flex items-center gap-1 text-xs text-faint">
                    <ExternalLink size={11} /> 홈페이지 있음
                  </span>
                ) : null}
              </Card>
            </a>
          ))}
        </div>
      )}
    </AlumniShell>
  );
}
