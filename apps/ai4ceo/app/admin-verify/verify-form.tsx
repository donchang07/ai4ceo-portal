"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";
import { Button, Input } from "@/components/ui";

export function VerifyForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      const totp = factors?.totp?.find((f) => f.status === "verified");
      if (!totp) throw new Error("등록된 인증 수단이 없습니다. 보안 설정에서 먼저 등록해 주세요.");

      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totp.id,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "코드 확인에 실패했습니다.");
      setBusy(false);
    }
  }

  return (
    <>
      <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-info-surface text-primary">
        <KeyRound size={22} />
      </span>
      <h1 className="mt-4 text-xl font-bold text-ink">2단계 인증</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        인증 앱(Google Authenticator)에 표시된 6자리 코드를 입력해 주세요.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <Input
          autoFocus
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          className="tnum text-center text-lg tracking-[0.3em]"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" variant="primary" full disabled={busy || code.length !== 6}>
          {busy ? "확인 중…" : "확인"}
        </Button>
      </form>
    </>
  );
}
