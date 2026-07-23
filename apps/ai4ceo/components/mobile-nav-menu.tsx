"use client";

// 로그인 후 셸(포탈·동문·관리자)의 모바일 메뉴. 데스크톱 사이드바/nav가 `md:hidden`으로
// 가려질 때, 햄버거 버튼으로 전체 메뉴를 여는 드롭다운을 제공한다.
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/core/cn";

export interface MobileNavItem {
  href: string;
  label: string;
  match?: string;
}

export function MobileNavMenu({
  items,
  dark = false,
}: {
  items: MobileNavItem[];
  dark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full border",
          dark ? "border-white/20 text-white" : "border-cardline text-ink",
        )}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 top-15 z-40 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <nav
            className={cn(
              "fixed inset-x-0 top-15 z-50 max-h-[70vh] overflow-y-auto border-t",
              dark ? "border-white/10 bg-dark text-white" : "border-hairline bg-surface",
            )}
          >
            <div className="mx-auto flex max-w-[1200px] flex-col px-6 py-2">
              {items.map((it) => {
                const active = pathname === it.href || (it.match && pathname.startsWith(it.match));
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "border-b py-3 text-sm last:border-b-0",
                      dark ? "border-white/10" : "border-hairline",
                      active
                        ? dark
                          ? "font-semibold text-white"
                          : "font-semibold text-primary"
                        : dark
                          ? "text-white/80 hover:text-white"
                          : "text-ink hover:text-primary",
                    )}
                  >
                    {it.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
