"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/core/cn";

const tabs = [
  { href: "/portal/cohort", label: "홈", icon: Home },
  { href: "/portal/sessions/s1", label: "세션", icon: Calendar, match: "/portal/sessions" },
  { href: "/portal/chat", label: "대화방", icon: MessageSquare, badge: 3 },
  { href: "/portal/ai", label: "AI 질문", icon: Sparkles },
];

export function MobileTabbar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-[rgba(255,255,255,.92)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map((t) => {
          const active = pathname === t.href || (t.match && pathname.startsWith(t.match));
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href} className={cn("relative flex flex-col items-center gap-0.5 py-2.5 text-[11px]", active ? "text-primary" : "text-faint")}>
              <Icon size={20} />
              {t.label}
              {t.badge ? (
                <span className="absolute right-6 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {t.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
