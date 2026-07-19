import Link from "next/link";
import { AlertTriangle, ArrowRight, MessageSquare } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Badge, Card, CardTitle, SectionTitle } from "@/components/ui";
import { getApplications, getInvoices } from "@/lib/db/queries";
import { COHORT_18 } from "@/lib/core/constants";
import { cn } from "@/lib/core/cn";

type Kpi = { label: string; value: string; caption: string };

type FunnelStep = { label: string; count: number; opacity: string };

type TodoItem = { tone: "danger" | "warning" | "neutral"; text: string; href: string };

export default async function AdminDashboardPage() {
  const [applications, invoices] = await Promise.all([getApplications(), getInvoices()]);

  const paidCount = invoices.filter((i) => i.status === "paid").length;

  const kpis: Kpi[] = [
    { label: "지원자", value: String(applications.length), caption: "최근 7일 +12" },
    { label: "추천 유입", value: "64%", caption: "지난 기수 대비 +9%p" },
    { label: "입금 완료", value: String(paidCount), caption: "Zoom 강의 — 정원 제한 없음" },
    { label: "결과물 완성률", value: "78%", caption: "9주차 종합 프로젝트 기준" },
  ];

  // 전형 퍼널 (대표 운영 수치) — 뒤 단계일수록 옅게
  const funnel: FunnelStep[] = [
    { label: "접수", count: 38, opacity: "opacity-100" },
    { label: "검토", count: 30, opacity: "opacity-[0.85]" },
    { label: "합격", count: 24, opacity: "opacity-70" },
    { label: "입금", count: 21, opacity: "opacity-[0.55]" },
    { label: "등록", count: 20, opacity: "opacity-40" },
  ];
  const funnelMax = funnel[0].count;

  const todos: TodoItem[] = [
    { tone: "danger", text: "합격 처리 대기 3건", href: "/admin/applications" },
    { tone: "warning", text: "입금 확인 필요 2건", href: "/admin/billing" },
    { tone: "neutral", text: "자료 교체 예약 1건", href: "/admin/curriculum" },
  ];

  const dotColor: Record<TodoItem["tone"], string> = {
    danger: "bg-danger",
    warning: "bg-warning",
    neutral: "bg-faint",
  };

  return (
    <AdminShell>
      <div className="flex items-center gap-3">
        <SectionTitle>운영 대시보드</SectionTitle>
        <Badge tone="info">18기</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">18기 선발·결제·커리큘럼 운영 현황을 한눈에 확인합니다.</p>

      {/* KPI */}
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <div className="text-sm text-muted">{k.label}</div>
            <div className="mt-2 text-[32px] font-bold leading-none tracking-tight tnum text-ink">{k.value}</div>
            <div className="mt-2 text-xs text-faint">{k.caption}</div>
          </Card>
        ))}
      </div>

      {/* 전형 퍼널 */}
      <Card className="mt-4">
        <CardTitle>전형 퍼널</CardTitle>
        <p className="mt-1 text-xs text-muted">접수부터 등록까지 단계별 전환 현황입니다.</p>
        <div className="mt-4 space-y-2">
          {funnel.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-10 shrink-0 text-sm font-medium text-muted">{s.label}</div>
              <div className="flex-1">
                <div
                  className={cn("flex h-9 items-center rounded-control bg-primary px-3 text-sm font-semibold text-white", s.opacity)}
                  style={{ width: `${Math.max(24, (s.count / funnelMax) * 100)}%` }}
                >
                  <span className="tnum">{s.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* 오늘 처리할 것 */}
        <Card>
          <CardTitle>오늘 처리할 것</CardTitle>
          <ul className="mt-4 divide-y divide-hairline">
            {todos.map((t) => (
              <li key={t.text} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", dotColor[t.tone])} />
                <span className="flex-1 text-sm text-ink">{t.text}</span>
                <Link
                  href={t.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  처리 <ArrowRight size={14} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* 알림 발송 현황 */}
        <Card>
          <CardTitle>알림 발송 현황</CardTitle>
          <p className="mt-1 text-xs text-muted">알림톡 발송 결과 · 실패 건은 SMS로 자동 대체됩니다.</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-control bg-surface-muted px-3 py-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
                <MessageSquare size={13} /> 성공
              </div>
              <div className="mt-1 text-2xl font-bold tnum text-ink">42</div>
            </div>
            <div className="rounded-control bg-surface-muted px-3 py-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
                <AlertTriangle size={13} /> 실패 → SMS
              </div>
              <div className="mt-1 text-2xl font-bold tnum text-danger">3</div>
            </div>
            <div className="rounded-control bg-surface-muted px-3 py-4 text-center">
              <div className="text-xs text-muted">성공률</div>
              <div className="mt-1 text-2xl font-bold tnum text-success">93%</div>
            </div>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
