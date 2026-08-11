"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, LogOut } from "lucide-react";
import { Button, Callout, Card, CardTitle, Input } from "@/components/ui";
import { saveProfile, signOut, type ProfileForm as ProfileFormValues } from "./actions";

interface ProfileFormProps {
  email: string;
  roleLabel: string;
  initial: ProfileFormValues;
}

export function ProfileForm({ email, roleLabel, initial }: ProfileFormProps) {
  const [form, setForm] = useState<ProfileFormValues>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, startSignOut] = useTransition();

  function set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await saveProfile(form).catch(() => null);
    if (result?.ok) setSaved(true);
    else setError(result?.error ?? "저장에 실패했습니다.");
    setBusy(false);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <Card>
        <CardTitle>내 정보</CardTitle>
        <p className="mt-1 text-[13px] text-muted">
          수강 안내와 수료증에 사용되는 정보입니다.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="text-[13px] font-medium text-ink">성함</label>
            <Input
              className="mt-1.5"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="홍길동"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[13px] font-medium text-ink">회사</label>
              <Input
                className="mt-1.5"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="예: 케이뱅크"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-ink">직함</label>
              <Input
                className="mt-1.5"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="대표이사"
              />
            </div>
          </div>
          <div>
            <label className="text-[13px] font-medium text-ink">연락처</label>
            <Input
              className="mt-1.5"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>

          <div className="space-y-2 border-t border-hairline pt-4">
            <label className="flex items-start gap-2.5 text-[13px] text-ink">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#2c5ce6]"
                checked={form.directory_opt_in}
                onChange={(e) => set("directory_opt_in", e.target.checked)}
              />
              <span>동문 디렉터리에 내 프로필을 공개합니다.</span>
            </label>
            <label className="flex items-start gap-2.5 text-[13px] text-ink">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#2c5ce6]"
                checked={form.marketing_opt_in}
                onChange={(e) => set("marketing_opt_in", e.target.checked)}
              />
              <span>새 기수·행사 안내를 받아봅니다.</span>
            </label>
          </div>

          {error && <Callout>{error}</Callout>}
          {saved && (
            <div className="flex items-center gap-2 rounded-[12px] border border-cardline bg-info-surface px-4 py-3 text-[13px] text-ink">
              <CheckCircle2 size={16} className="shrink-0 text-success" /> 저장되었습니다.
            </div>
          )}

          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "저장 중…" : "저장"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>계정</CardTitle>
        <dl className="mt-4 space-y-3 text-[13px]">
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted">이메일</dt>
            <dd className="break-all text-right font-medium text-ink">{email}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted">구분</dt>
            <dd className="text-right font-medium text-ink">{roleLabel}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-faint">
          이메일은 로그인 계정이라 직접 바꿀 수 없습니다. 변경이 필요하시면 문의해 주세요.
        </p>

        <div className="mt-5 border-t border-hairline pt-5">
          <Button
            variant="secondary"
            full
            disabled={signingOut}
            onClick={() => startSignOut(async () => void (await signOut()))}
          >
            <LogOut size={16} /> {signingOut ? "로그아웃 중…" : "로그아웃"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
