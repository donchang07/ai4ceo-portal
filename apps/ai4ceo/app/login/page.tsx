"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Mail } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/db/supabase-client";
import { Button, Input, Callout } from "@/components/ui";

type Mode = "password" | "magic-link";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (!accessToken || !refreshToken) return;

    const requestedNext = new URLSearchParams(window.location.search).get("next") ?? "/portal/cohort";
    const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/portal/cohort";
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

    void (async () => {
      setLoading(true);
      const supabase = getSupabaseBrowser();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        setError("로그인 링크가 만료되었거나 이미 사용되었습니다.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/finalize", { method: "POST" });
      if (!response.ok) {
        setError("로그인 정보를 확인하지 못했습니다. 다시 시도해 주세요.");
        setLoading(false);
        return;
      }
      const { hasPassword } = (await response.json()) as { hasPassword: boolean };
      router.replace(hasPassword ? next : `/set-password?next=${encodeURIComponent(next)}`);
      router.refresh();
    })();
  }, [router]);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/portal/cohort");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function submitMagicLink(e: React.FormEvent) {
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
      console.error("[login] signInWithOtp failed", err);
      const rawMessage = err instanceof Error ? err.message : "";
      // supabase-js sometimes surfaces "{}" or another non-descriptive body for 5xx
      // responses (e.g. an SMTP failure on the server) — show a helpful fallback instead.
      const message =
        /rate limit|security purposes|after \d+ seconds?/i.test(rawMessage)
          ? "보안을 위해 잠시 후 다시 요청해 주세요."
          : /email address.*invalid/i.test(rawMessage)
            ? "올바른 이메일 주소를 입력해 주세요."
            : "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      data-testid="login-root"
      data-hydrated={hydrated ? "true" : "false"}
      className="grid min-h-screen place-items-center bg-canvas px-5"
    >
      <div className="w-full max-w-sm rounded-[15px] border border-hairline bg-surface p-7">
        <Link href="/" className="mb-6 flex items-center gap-2 font-bold text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-white">
            <Sparkles size={18} />
          </span>
          AI4CEO
        </Link>

        {mode === "password" ? (
          <>
            <h1 className="text-xl font-bold text-ink">로그인</h1>
            <p className="mt-1 text-sm text-muted">이메일과 비밀번호로 로그인하세요.</p>

            <form onSubmit={submitPassword} className="mt-5 space-y-3">
              <Input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                required
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error ? <p className="text-xs text-danger">{error}</p> : null}
              <Button type="submit" variant="primary" full disabled={loading || !hydrated}>
                {loading ? "로그인 중…" : "로그인"}
              </Button>
            </form>

            <button
              type="button"
              disabled={!hydrated}
              onClick={() => {
                setMode("magic-link");
                setError(null);
              }}
              className="mt-4 w-full text-center text-xs font-medium text-primary hover:underline"
            >
              처음 로그인이거나 비밀번호를 잊으셨나요? 매직링크로 로그인
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-ink">매직링크 로그인</h1>
            <p className="mt-1 text-sm text-muted">
              이메일로 로그인 링크를 보내드립니다. 최초 로그인 시에는 이후 비밀번호를 설정하게
              됩니다.
            </p>

            {sent ? (
              <Callout className="mt-5">
                <Mail size={16} className="mt-0.5 shrink-0" />
                <span>{email}로 로그인 링크를 보냈습니다. 메일함을 확인해 주세요.</span>
              </Callout>
            ) : (
              <form onSubmit={submitMagicLink} className="mt-5 space-y-3">
                <Input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {error ? <p className="text-xs text-danger">{error}</p> : null}
                <Button type="submit" variant="primary" full disabled={loading || !hydrated}>
                  {loading ? "발송 중…" : "매직링크 받기"}
                </Button>
              </form>
            )}

            <button
              type="button"
              disabled={!hydrated}
              onClick={() => {
                setMode("password");
                setSent(false);
                setError(null);
              }}
              className="mt-4 w-full text-center text-xs font-medium text-primary hover:underline"
            >
              비밀번호로 로그인
            </button>
          </>
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
