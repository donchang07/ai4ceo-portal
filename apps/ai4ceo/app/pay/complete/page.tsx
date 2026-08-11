import { CheckCircle2 } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { Button, Callout } from "@/components/ui";
import { formatKRW } from "@/lib/core/constants";

// 토스 결제창 successUrl. 승인(confirm)은 라이브 전환 시 활성화하며,
// 현재는 테스트 키 기준으로 결제 요청 결과만 표기한다.
export default async function PayCompletePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pick = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) ?? null;
  const orderId = pick("orderId");
  const paymentKey = pick("paymentKey");
  const amount = Number(pick("amount") ?? 0);

  const rows: [string, string][] = [
    ["주문번호", orderId ?? "-"],
    ["결제 금액", amount > 0 ? formatKRW(amount) : "-"],
    ["결제 키", paymentKey ?? "-"],
  ];

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <main className="mx-auto flex max-w-[560px] flex-col items-center px-6 py-20 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-info-surface text-success">
          <CheckCircle2 size={28} />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-ink">결제 요청이 완료되었습니다</h1>
        <p className="mt-2 text-sm text-muted">
          결제 결과는 입력하신 연락처로 안내드립니다. 문의 사항은 문의하기로 접수해 주세요.
        </p>

        <div className="mt-6 w-full space-y-2 rounded-[15px] border border-hairline bg-surface p-5 text-left">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <span className="shrink-0 text-xs text-faint">{label}</span>
              <span className="tnum break-all text-right text-[13px] font-medium text-ink">{value}</span>
            </div>
          ))}
        </div>

        <Callout className="mt-5 text-left">
          현재 테스트 연동 상태로, 실제 카드 승인은 이루어지지 않습니다.
        </Callout>

        <div className="mt-8 flex gap-2">
          <Button href="/" variant="secondary">홈으로</Button>
          <Button href="/contact" variant="ghost">문의하기</Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
