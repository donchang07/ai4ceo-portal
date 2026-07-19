import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-15 max-w-[1200px] items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-white">
            <Sparkles size={18} />
          </span>
          AI4CEO
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <Link href="/program" className="hover:text-ink">과정 안내</Link>
          <Link href="/trends" className="hover:text-ink">AI 브리프</Link>
          <Link href="/login" className="hover:text-ink">로그인</Link>
        </nav>
        <Button href="/apply" variant="primary">지원하기</Button>
      </div>
    </header>
  );
}
