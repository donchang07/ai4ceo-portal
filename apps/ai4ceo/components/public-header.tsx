import Link from "next/link";
import { Command } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 text-base font-bold">
          <Command size={20} className="text-primary" /> AI4CEO Portal
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/#course"
            className="rounded-control px-3 py-2 text-ink hover:bg-surface-muted"
          >
            과정 소개
          </Link>
          <Link
            href="/#faq"
            className="rounded-control px-3 py-2 text-ink hover:bg-surface-muted"
          >
            질의응답
          </Link>
          <Link
            href="/portal"
            className="rounded-control px-3 py-2 text-ink hover:bg-surface-muted"
          >
            로그인
          </Link>
          <Link
            href="/apply"
            className="ml-1 inline-flex min-h-9 items-center rounded-control border border-primary-hover bg-primary px-4 font-semibold text-white hover:bg-primary-hover"
          >
            지원하기
          </Link>
        </nav>
      </div>
    </header>
  );
}
