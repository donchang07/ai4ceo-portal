"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, CreditCard, Sparkles, Newspaper, GraduationCap, CalendarClock, Package } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/core/cn";

const nav = [
  { href: "/admin", label: "운영 대시보드", icon: LayoutDashboard },
  { href: "/admin/applications", label: "선발 관리", icon: Users },
  { href: "/admin/cohorts", label: "기수 관리", icon: GraduationCap },
  { href: "/admin/curriculum", label: "커리큘럼 편집", icon: FileText },
  { href: "/admin/bookings", label: "예약 관리", icon: CalendarClock },
  { href: "/admin/version-packs", label: "버전 팩", icon: Package },
  { href: "/admin/contents", label: "AI 뉴스·브리프", icon: Newspaper },
  { href: "/admin/billing", label: "결제·세금계산서", icon: CreditCard },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 hidden w-[224px] flex-col bg-dark px-4 py-5 text-white md:flex">
        <Link href="/admin" className="mb-6 flex items-center gap-2 px-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-white">
            <Sparkles size={18} />
          </span>
          AI4CEO Admin
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map((n) => {
            const active = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-control px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-[rgba(44,92,230,.35)] text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon size={18} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-2 text-[11px] text-white/40">장동인 교수 · 관리자</div>
      </aside>

      <div className="md:pl-[224px]">
        <main className="mx-auto max-w-[1440px] px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
