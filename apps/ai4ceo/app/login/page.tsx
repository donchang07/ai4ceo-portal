"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";
import { Button, Input, Callout } from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "메일 발송에 실패했습니다.");
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
        <h1 className="text-xl font-bold text-ink">로그인</h1>
        <p className="mt-1 text-sm text-muted">이메일로 매직링크를 보내드립니다.</p>

        {sent ? (
          <Callout className="mt-5">
            <Mail size={16} className="mt-0.5 shrink-0" />
            <span>{email}로 로그인 링크를 보냈습니다. 메일함을 확인해 주세요.</span>
          </Callout>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <Input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error ? <p className="text-xs text-danger">{error}</p> : null}
            <Button type="submit" variant="primary" full disabled={loading}>
              {loading ? "발송 중…" : "매직링크 받기"}
            </Button>
          </form>
        )}
        <p className="mt-5 text-center text-xs text-faint">
          아직 지원 전이신가요?{" "}
          <Link href="/apply" className="font-semibold text-primary">
            지원서 작성
          </Link>
        </p>
      </div>
    </div>
  );
}
