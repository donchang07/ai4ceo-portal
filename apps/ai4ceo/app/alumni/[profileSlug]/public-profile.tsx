import { Building2, Globe, Lock, Mail, UserCircle2 } from "lucide-react";
import { Badge, Card } from "@/components/ui";

// Design Ref: prd-v3-cycle5.design.md §5

export interface PublicProfileRow {
  user_id: string;
  display_name: string | null;
  job_title: string | null;
  company_name: string | null;
  bio: string | null;
  expertise: string | null;
  company_description: string | null;
  homepage_url: string | null;
  contact_interest: string | null;
  contact_email: string | null;
  show_contact: boolean;
  public_message: string | null;
  cohort_label: string | null;
}

export function PublicProfile({ profile }: { profile: PublicProfileRow | null }) {
  if (!profile) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-muted text-faint">
            <Lock size={22} />
          </span>
          <p className="text-sm font-semibold text-ink">비공개 프로필입니다</p>
          <p className="max-w-xs text-[13px] text-muted">
            이 프로필은 동문에게만 공개되었거나, 아직 공개되지 않았습니다.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-info-surface text-primary">
          <UserCircle2 size={30} />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-ink">{profile.display_name ?? "동문"}</h1>
            {profile.cohort_label ? <Badge tone="neutral">{profile.cohort_label}</Badge> : null}
          </div>
          {profile.job_title || profile.company_name ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              <Building2 size={14} />
              {[profile.job_title, profile.company_name].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
      </div>

      {profile.public_message ? (
        <Card className="mt-5 bg-info-surface/60">
          <p className="whitespace-pre-wrap text-sm text-ink">{profile.public_message}</p>
        </Card>
      ) : null}

      {profile.bio ? (
        <Card className="mt-4">
          <p className="whitespace-pre-wrap text-sm text-ink">{profile.bio}</p>
        </Card>
      ) : null}

      {profile.company_description ? (
        <Card className="mt-4">
          <p className="text-xs font-semibold text-muted">회사 소개</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink">{profile.company_description}</p>
        </Card>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {profile.expertise ? <Badge tone="info">#{profile.expertise}</Badge> : null}
        {profile.homepage_url ? (
          <a
            href={profile.homepage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-cardline px-3 py-1 text-xs font-medium text-primary hover:bg-info-surface"
          >
            <Globe size={12} /> 홈페이지
          </a>
        ) : null}
      </div>

      {profile.contact_interest || (profile.show_contact && profile.contact_email) ? (
        <Card className="mt-4">
          <p className="text-xs font-semibold text-muted">연락·협업</p>
          {profile.contact_interest ? <p className="mt-1.5 text-sm text-ink">{profile.contact_interest}</p> : null}
          {profile.show_contact && profile.contact_email ? (
            <a
              href={`mailto:${profile.contact_email}`}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Mail size={13} /> {profile.contact_email}
            </a>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
