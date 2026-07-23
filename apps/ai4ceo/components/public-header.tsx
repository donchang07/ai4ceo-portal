"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Menu, X } from "lucide-react";
import { Button } from "@/components/ui";

const NAV_LINKS = [
  { href: "/program", label: "과정 안내" },
  { href: "/trends", label: "AI 브리프" },
  { href: "/login", label: "로그인" },
] as const;

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-15 max-w-[1200px] items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink" onClick={() => setOpen(false)}>
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-white">
            <Sparkles size={18} />
          </span>
          AI4CEO
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button href="/apply" variant="primary">지원하기</Button>
          {/* 모바일 햄버거 */}
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-cardline text-ink md:hidden"
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {open && (
        <nav className="border-t border-hairline bg-surface md:hidden">
          <div className="mx-auto flex max-w-[1200px] flex-col px-6 py-2">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="border-b border-hairline py-3 text-sm text-ink last:border-b-0 hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
