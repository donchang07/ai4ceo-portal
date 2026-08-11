import { XCircle } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui";

// 토스 결제창 failUrl — 사용자가 결제를 취소했거나 승인이 거절된 경우.
export default async function PayFailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pick = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) ?? null;
  const code = pick("code");
  const message = pick("message");

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <main className="mx-auto flex max-w-[560px] flex-col items-center px-6 py-20 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-danger/10 text-danger">
          <XCircle size={28} />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-ink">결제가 완료되지 않았습니다</h1>
        <p className="mt-2 text-sm text-muted">{message ?? "결제가 취소되었거나 승인이 거절되었습니다."}</p>
        {code && <p className="mt-1 text-xs text-faint">오류 코드: {code}</p>}

        <div className="mt-8 flex gap-2">
          <Button href="/pay" variant="primary">다시 결제하기</Button>
          <Button href="/contact" variant="secondary">문의하기</Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
