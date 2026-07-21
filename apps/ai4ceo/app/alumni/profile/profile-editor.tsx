"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { UserCircle2, Eye, Lock, Users, Globe, ExternalLink } from "lucide-react";
import { AlumniShell } from "@/components/alumni-shell";
import { Badge, Button, Card, CardTitle, Callout, Chip, Input, SectionTitle, Textarea } from "@/components/ui";
import { saveAlumniProfile, type AlumniProfileInput } from "./actions";

// Design Ref: prd-v3-cycle5.design.md §3 — E-6. 완전 optional, 기본 비공개 원칙.

export interface AlumniProfileRow extends Partial<AlumniProfileInput> {
  user_id: string;
}

const VISIBILITY_OPTS: { value: AlumniProfileInput["visibility"]; label: string; icon: typeof Lock }[] = [
  { value: "private", label: "비공개", icon: Lock },
  { value: "alumni_only", label: "동문 전용", icon: Users },
  { value: "public", label: "전체 공개", icon: Globe },
];

export function ProfileEditor({
  userId,
  profile,
  defaults,
}: {
  userId: string;
  profile: AlumniProfileRow | null;
  defaults: { display_name: string; job_title: string; company_name: string; cohort_label: string };
}) {
  const [form, setForm] = useState<AlumniProfileInput>({
    display_name: profile?.display_name ?? defaults.display_name,
    job_title: profile?.job_title ?? defaults.job_title,
    company_name: profile?.company_name ?? defaults.company_name,
    bio: profile?.bio ?? "",
    expertise: profile?.expertise ?? "",
    company_description: profile?.company_description ?? "",
    homepage_url: profile?.homepage_url ?? "",
    contact_interest: profile?.contact_interest ?? "",
    contact_email: profile?.contact_email ?? "",
    show_contact: profile?.show_contact ?? false,
    public_message: profile?.public_message ?? "",
    cohort_label: profile?.cohort_label ?? defaults.cohort_label,
    visibility: profile?.visibility ?? "private",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof AlumniProfileInput>(key: K, value: AlumniProfileInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await saveAlumniProfile(form);
      if (!r.ok) setError(r.message);
      else setSaved(true);
    });
  }

  return (
    <AlumniShell>
      <div className="mx-auto max-w-[640px]">
        <div className="flex items-center gap-2">
          <UserCircle2 size={22} className="text-primary" />
          <SectionTitle>내 공개 프로필</SectionTitle>
        </div>
        <p className="mt-1.5 text-sm text-muted">
          완전히 선택 사항입니다. 아무것도 입력하지 않아도 불이익이 없습니다. 공개 범위는
          언제든 바꿀 수 있습니다.
        </p>

        <Card className="mt-5">
          <CardTitle>공개 범위</CardTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {VISIBILITY_OPTS.map((opt) => (
              <Chip key={opt.value} active={form.visibility === opt.value} onClick={() => update("visibility", opt.value)}>
                <opt.icon size={13} /> {opt.label}
              </Chip>
            ))}
          </div>
          {form.visibility !== "private" ? (
            <Link
              href={`/alumni/${userId}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Eye size={13} /> 공개 프로필 미리보기 <ExternalLink size={11} />
            </Link>
          ) : null}
        </Card>

        <Card className="mt-4">
          <CardTitle>기본 정보</CardTitle>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input placeholder="이름" value={form.display_name} onChange={(e) => update("display_name", e.target.value)} />
            <Input placeholder="직함" value={form.job_title} onChange={(e) => update("job_title", e.target.value)} />
            <Input placeholder="회사명" value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
            <Input placeholder="기수 (예: 17기)" value={form.cohort_label} onChange={(e) => update("cohort_label", e.target.value)} />
          </div>
        </Card>

        <Card className="mt-4">
          <CardTitle>소개</CardTitle>
          <div className="mt-3 space-y-3">
            <Textarea rows={3} placeholder="자기소개" value={form.bio} onChange={(e) => update("bio", e.target.value)} />
            <Input placeholder="전문 분야 (예: 제조업 AX, 재무)" value={form.expertise} onChange={(e) => update("expertise", e.target.value)} />
            <Textarea
              rows={2}
              placeholder="회사 소개"
              value={form.company_description}
              onChange={(e) => update("company_description", e.target.value)}
            />
            <Input placeholder="홈페이지·링크" value={form.homepage_url} onChange={(e) => update("homepage_url", e.target.value)} />
            <Textarea
              rows={2}
              placeholder="공개 메시지 (동문에게 하고 싶은 말)"
              value={form.public_message}
              onChange={(e) => update("public_message", e.target.value)}
            />
          </div>
        </Card>

        <Card className="mt-4">
          <CardTitle>연락·협업</CardTitle>
          <div className="mt-3 space-y-3">
            <Input
              placeholder="연락·협업 관심사 (예: AX 자문, 공동 프로젝트)"
              value={form.contact_interest}
              onChange={(e) => update("contact_interest", e.target.value)}
            />
            <div className="flex items-center justify-between rounded-[12px] border border-cardline bg-canvas px-4 py-3">
              <span className="text-sm text-ink">연락처 공개</span>
              <button
                type="button"
                role="switch"
                aria-checked={form.show_contact}
                onClick={() => update("show_contact", !form.show_contact)}
                className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors ${form.show_contact ? "bg-primary" : "bg-cardline"}`}
              >
                <span
                  className={`absolute left-[2px] top-[2px] h-[22px] w-[22px] rounded-full bg-white transition-transform ${form.show_contact ? "translate-x-5" : ""}`}
                />
              </button>
            </div>
            {form.show_contact ? (
              <Input
                type="email"
                placeholder="공개할 연락 이메일"
                value={form.contact_email}
                onChange={(e) => update("contact_email", e.target.value)}
              />
            ) : null}
          </div>
        </Card>

        {error ? <Callout className="mt-4">{error}</Callout> : null}
        <div className="mt-5 flex items-center gap-3">
          <Button variant="primary" onClick={save} disabled={pending}>
            저장
          </Button>
          {saved ? <Badge tone="done">저장됨</Badge> : null}
        </div>
      </div>
    </AlumniShell>
  );
}
