"use client";

import { useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { Badge, Button, Callout, Card, CardTitle, Chip } from "@/components/ui";
import type { Invoice } from "@/lib/db/types";
import { formatKRW } from "@/lib/core/constants";
import { cn } from "@/lib/core/cn";

type Tab = "invoices" | "deposits" | "tax";
type Tone = "progress" | "done" | "wait" | "danger" | "info" | "neutral";

const TABS: { key: Tab; label: string }[] = [
  { key: "invoices", label: "인보이스" },
  { key: "deposits", label: "입금 확인" },
  { key: "tax", label: "세금계산서 큐" },
];

const METHOD_LABEL: Record<Invoice["method"], string> = {
  bank_transfer: "계좌이체",
  smartstore: "스마트스토어",
  toss: "Toss",
};

function statusInfo(inv: Invoice): { label: string; tone: Tone } {
  if (inv.status === "paid") return { label: "입금 완료", tone: "done" };
  if (inv.status === "cancelled") return { label: "취소", tone: "danger" };
  if (inv.method === "bank_transfer") return { label: "입금 대기 D+3", tone: "wait" };
  if (inv.method === "smartstore") return { label: "구매확정 대조 중", tone: "info" };
  return { label: "발행됨", tone: "neutral" };
}

function taxInfo(inv: Invoice): { label: string; tone: Tone } {
  if (inv.method === "toss") return { label: "Toss 증빙", tone: "neutral" };
  if (!inv.biz_reg_no) return { label: "대상 아님", tone: "neutral" };
  if (inv.status === "paid") return { label: "발행 완료", tone: "done" };
  return { label: "발행 대기", tone: "wait" };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function BillingPanel({ invoices }: { invoices: Invoice[] }) {
  const [tab, setTab] = useState<Tab>("invoices");
  const [rows, setRows] = useState<Invoice[]>(invoices);

  const visible = useMemo(() => {
    if (tab === "deposits") return rows.filter((r) => r.status === "issued");
    if (tab === "tax") return rows.filter((r) => r.biz_reg_no && r.method !== "toss");
    return rows;
  }, [rows, tab]);

  const byMethod = useMemo(() => {
    const c: Record<Invoice["method"], number> = { bank_transfer: 0, smartstore: 0, toss: 0 };
    for (const r of rows) c[r.method] += 1;
    return c;
  }, [rows]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Chip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </Chip>
        ))}
      </div>

      <Callout className="mt-4">
        세금계산서는 mock 모드입니다 — 발행 시뮬레이션·로그만 기록됩니다. API 키 설정 시 실발행됩니다. Toss 결제 건은 Toss가 증빙을 처리합니다.
      </Callout>

      <div className="mt-4 overflow-hidden rounded-[15px] border border-hairline bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-hairline bg-surface-muted text-left text-xs font-semibold text-muted">
                <th className="px-4 py-3">법인 · 수강생</th>
                <th className="px-4 py-3">금액</th>
                <th className="px-4 py-3">경로</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">증빙</th>
                <th className="px-4 py-3">날짜</th>
                {tab === "deposits" && <th className="px-4 py-3 text-right" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {visible.map((r) => {
                const st = statusInfo(r);
                const tax = taxInfo(r);
                const pendingBank = r.status === "issued" && r.method === "bank_transfer";
                return (
                  <tr key={r.id} className={cn(pendingBank && "bg-[#FFFBF9]")}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">{r.biz_name}</div>
                      <div className="text-xs text-muted">{r.student_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="tnum font-medium text-ink">{formatKRW(r.amount)}</div>
                      <div className="text-xs text-faint">VAT 포함</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">
                        {r.method === "toss" && <Flag size={11} className="text-accent" />}
                        {METHOD_LABEL[r.method]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={tax.tone}>{tax.label}</Badge>
                    </td>
                    <td className="px-4 py-3 tnum text-muted">{formatDate(r.created_at)}</td>
                    {tab === "deposits" && (
                      <td className="px-4 py-3 text-right">
                        {pendingBank ? (
                          <form method="post" action={`/api/admin/invoices/${r.id}/confirm`}>
                            <Button type="submit" variant="outline" className="min-h-8 px-3 text-xs">
                              입금 확인 처리
                            </Button>
                          </form>
                        ) : (
                          <span className="text-xs text-faint">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={tab === "deposits" ? 7 : 6} className="px-4 py-10 text-center text-muted">
                    해당 항목이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>세금계산서 요청 큐</CardTitle>
          <ul className="mt-4 space-y-3">
            {rows
              .filter((r) => r.biz_reg_no && r.method !== "toss")
              .map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-ink">{r.biz_name}</div>
                    <div className="text-xs text-muted tnum">{r.biz_reg_no}</div>
                  </div>
                  {r.status === "paid" ? (
                    <Badge tone="done">국세청 전송 완료</Badge>
                  ) : (
                    <Badge tone="wait">발행 대기</Badge>
                  )}
                </li>
              ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>경로별 집계</CardTitle>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-control bg-surface-muted px-3 py-4 text-center">
              <div className="text-xs text-muted">계좌이체</div>
              <div className="mt-1 text-2xl font-bold tnum text-ink">{byMethod.bank_transfer}</div>
            </div>
            <div className="rounded-control bg-surface-muted px-3 py-4 text-center">
              <div className="text-xs text-muted">스마트스토어</div>
              <div className="mt-1 text-2xl font-bold tnum text-ink">{byMethod.smartstore}</div>
            </div>
            <div className="rounded-control bg-surface-muted px-3 py-4 text-center">
              <div className="text-xs text-muted">Toss</div>
              <div className="mt-1 text-2xl font-bold tnum text-ink">{byMethod.toss}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
