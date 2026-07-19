"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Sparkles } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";
import { Button, Input, Callout } from "@/components/ui";
import { markPasswordSet } from "./actions";

export function SetPasswordView({ next }: { next: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      const result = await markPasswordSet();
      if (!result.ok) throw new Error(result.message);

      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-5">
      <div className="w-full max-w-sm rounded-[15px] border border-hairline bg-surface p-7">
        <Link href="/" className="mb-6 flex items-center gap-2 font-bold text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-white">
            <Sparkles size={18} />
          </span>
          AI4CEO
        </Link>
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-primary" />
          <h1 className="text-xl font-bold text-ink">비밀번호 설정</h1>
        </div>
        <p className="mt-1 text-sm text-muted">
          매직링크 로그인은 이번이 마지막입니다. 앞으로는 이메일과 비밀번호로 로그인하실 수 있도록
          비밀번호를 설정해 주세요.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <Input
            type="password"
            required
            placeholder="새 비밀번호 (8자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type="password"
            required
            placeholder="비밀번호 확인"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error ? <p className="text-xs text-danger">{error}</p> : null}
          <Button type="submit" variant="primary" full disabled={loading}>
            {loading ? "설정 중…" : "비밀번호 설정하고 계속하기"}
          </Button>
        </form>

        <Callout className="mt-5">
          <span>다음 로그인부터는 로그인 화면에서 이메일과 비밀번호를 입력하시면 됩니다.</span>
        </Callout>
      </div>
    </div>
  );
}
