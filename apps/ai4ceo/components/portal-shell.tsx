"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, MessageSquare, Sparkles, FileText, Bell, CreditCard, ShieldCheck, ListTodo } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/core/cn";
import { Badge } from "@/components/ui";
import { MobileTabbar } from "@/components/mobile-tabbar";
import { useIsAdmin } from "@/lib/core/admin-context";

const nav = [
  { href: "/portal/cohort", label: "홈", icon: Home },
  { href: "/portal/sessions/s1", label: "세션", icon: Calendar, match: "/portal/sessions" },
  { href: "/portal/chat", label: "대화방", icon: MessageSquare, count: 3 },
  { href: "/portal/ai", label: "AI 조교", icon: Sparkles },
  { href: "/portal/tasks", label: "위임 할 일", icon: ListTodo },
  { href: "/portal/billing", label: "내 결제", icon: CreditCard },
  { href: "/trends", label: "AI 브리프", icon: FileText },
];

export function PortalShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  const items = isAdmin
    ? [...nav, { href: "/admin", label: "관리자", icon: ShieldCheck, match: "/admin" }]
    : nav;
  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] flex-col border-r border-hairline bg-surface px-4 py-5 md:flex">
        <Link href="/portal/cohort" className="mb-6 flex items-center gap-2 px-2 font-bold text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-white">
            <Sparkles size={18} />
          </span>
          AI4CEO
        </Link>
        <nav className="flex flex-col gap-1">
          {items.map((n) => {
            const active = pathname === n.href || (n.match && pathname.startsWith(n.match));
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-control px-3 py-2 text-sm font-medium",
                  active ? "bg-info-surface text-primary" : "text-muted hover:bg-surface-muted",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={18} /> {n.label}
                </span>
                {n.count ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">{n.count}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="md:pl-[248px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-15 items-center justify-between border-b border-hairline bg-surface/90 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-cardline bg-surface px-3 py-1 text-sm font-semibold text-ink">
              18기 <Badge tone="progress">교육 중</Badge>
            </span>
            {title ? <span className="hidden text-sm text-muted md:inline">{title}</span> : null}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-muted hover:text-ink" aria-label="알림">
              <Bell size={20} />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-danger" />
            </button>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-muted text-sm font-semibold text-primary">나</span>
          </div>
        </header>

        <main className="mx-auto max-w-[1200px] px-5 pb-24 pt-6 md:pb-10">{children}</main>
      </div>

      <MobileTabbar />
    </div>
  );
}
