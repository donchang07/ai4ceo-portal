"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/core/cn";
import { Badge } from "@/components/ui";

const nav = [
  { href: "/alumni", label: "동문 홈" },
  { href: "/alumni#as", label: "AS Q&A" },
  { href: "/alumni#directory", label: "디렉토리" },
  { href: "/alumni/archive", label: "아카이브" },
  { href: "/trends", label: "AI 브리프" },
  { href: "/alumni/membership", label: "멤버십" },
];

export function AlumniShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-hairline bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-15 max-w-[1200px] items-center justify-between px-6 py-3">
          <Link href="/alumni" className="flex items-center gap-2 font-bold text-ink">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-white">
              <Sparkles size={18} />
            </span>
            AI4CEO 동문
          </Link>
          <nav className="hidden items-center gap-5 text-sm md:flex">
            {nav.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className={cn("text-muted hover:text-ink", pathname === n.href && "font-semibold text-ink")}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <Badge tone="done">멤버십 이용 중</Badge>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 py-8">{children}</main>
    </div>
  );
}
