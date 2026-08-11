"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";
import { Badge, Button, Callout, Card, CardTitle, Input } from "@/components/ui";

interface Enrollment {
  factorId: string;
  qr: string;
  secret: string;
}

export function TotpSetup({ enrolled }: { enrolled: boolean }) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function startEnroll() {
    setBusy(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      // 이전에 완료하지 못한 등록이 남아 있으면 정리한다 (미검증 factor는 재사용하지 않는다).
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const f of existing?.all ?? []) {
        if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `AI4CEO Admin ${new Date().toISOString().slice(0, 10)}`,
      });
      if (enrollError) throw enrollError;
      setEnrollment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (err) {
      setError(err instanceof Error ? err.message : "인증 수단 등록을 시작하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollment) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollment.factorId,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;
      setDone(true);
      setEnrollment(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "코드가 올바르지 않습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (enrolled && !enrollment) {
    return (
      <Card>
        <div className="flex items-center gap-2">
          <CardTitle>2단계 인증</CardTitle>
          <Badge tone="done">등록됨</Badge>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          인증 앱이 등록되어 있습니다. 로그인할 때마다 6자리 코드를 입력하게 됩니다.
        </p>
        <Callout className="mt-4">
          인증 앱을 바꾸시려면 Supabase 콘솔에서 기존 인증 수단을 삭제한 뒤 이 화면에서 다시 등록해 주세요.
        </Callout>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>2단계 인증 등록</CardTitle>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        Google Authenticator 같은 인증 앱을 등록하면, 비밀번호가 유출되어도 관리자 화면에 들어올 수 없습니다.
      </p>

      {done && (
        <div className="mt-4 flex items-center gap-2 rounded-[12px] border border-cardline bg-info-surface px-4 py-3 text-[13px] text-ink">
          <CheckCircle2 size={16} className="shrink-0 text-success" /> 2단계 인증이 등록되었습니다.
        </div>
      )}

      {!enrollment ? (
        <Button variant="primary" className="mt-5" disabled={busy} onClick={startEnroll}>
          {busy ? "준비 중…" : "인증 앱 등록 시작"}
        </Button>
      ) : (
        <div className="mt-5">
          <ol className="space-y-1.5 text-[13px] leading-relaxed text-muted">
            <li>1. 휴대폰에서 Google Authenticator를 엽니다.</li>
            <li>2. [+] → [QR 코드 스캔]으로 아래 QR을 찍습니다.</li>
            <li>3. 앱에 표시된 6자리 코드를 입력합니다.</li>
          </ol>

          {/* Supabase가 SVG data URL을 내려준다 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enrollment.qr}
            alt="2단계 인증 QR 코드"
            className="mt-4 h-48 w-48 rounded-[12px] border border-hairline bg-white p-2"
          />

          <div className="mt-4 rounded-[12px] border border-cardline bg-info-surface px-4 py-3">
            <p className="text-xs font-semibold text-ink">비밀키 (반드시 안전한 곳에 보관하세요)</p>
            <p className="tnum mt-1 break-all font-mono text-[13px] text-ink">{enrollment.secret}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              휴대폰을 분실하면 이 값으로만 다른 기기의 인증 앱에 복원할 수 있습니다. 비밀번호 관리자에
              저장해 두세요.
            </p>
          </div>

          <form onSubmit={confirm} className="mt-4 space-y-3">
            <Input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className="tnum text-center text-lg tracking-[0.3em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <Button type="submit" variant="primary" full disabled={busy || code.length !== 6}>
              {busy ? "확인 중…" : "등록 완료"}
            </Button>
          </form>
        </div>
      )}

      {error && <Callout className="mt-4">{error}</Callout>}
    </Card>
  );
}
