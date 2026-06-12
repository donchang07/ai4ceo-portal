"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  MessagesSquare,
  Sparkles,
  Folder,
  ClipboardList,
  Command,
  ChevronDown,
} from "lucide-react";

const nav = [
  { href: "/portal", label: "홈", icon: LayoutDashboard },
  { href: "/portal/sessions", label: "세션", icon: CalendarDays },
  { href: "/portal/chat", label: "대화방", icon: MessagesSquare },
  { href: "/portal/ai", label: "AI 질문", icon: Sparkles },
  { href: "/portal/files", label: "자료", icon: Folder },
  { href: "/portal/assignments", label: "과제", icon: ClipboardList },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 md:grid-cols-[220px_1fr]">
      <aside className="hidden border-r bg-surface-muted px-4 py-5 md:block">
        <div className="mb-6 flex items-center gap-2 text-base font-bold">
          <Command size={20} className="text-primary" /> AI4CEO
        </div>
        <button className="mb-6 flex w-full items-center justify-between rounded-control border bg-surface px-2.5 py-2 text-xs text-muted">
          <span>3기 · 6월</span>
          <ChevronDown size={16} />
        </button>
        <nav className="flex flex-col gap-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-control px-2.5 py-2.5 text-sm ${
                  active
                    ? "bg-primary font-semibold text-white"
                    : "text-ink hover:bg-surface"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="bg-canvas p-6">{children}</main>
    </div>
  );
}
