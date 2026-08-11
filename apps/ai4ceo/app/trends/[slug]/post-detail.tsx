import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui";
import type { Post } from "@/lib/db/types";

// Design Ref: prd-v3-cycle3.design.md §3 — F-1·F-5·F-6 상세 렌더
// AI 브리프는 전부 공개다 — 열람 제한이나 티저를 두지 않는다.

const CATEGORY_LABEL: Record<Post["category"], string> = {
  ai_news: "AI 뉴스",
  tech: "기술",
  ax: "기업 AX",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function PostDetail({ post }: { post: Post }) {
  return (
    <div>
      <Link href="/trends" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} /> 목록으로
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{CATEGORY_LABEL[post.category]}</Badge>
        <span className="text-xs text-muted">{fmtDate(post.published_at)}</span>
      </div>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">{post.title}</h1>

      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
        {post.body_mdx?.trim() || post.excerpt}
      </p>
      {post.external_url ? (
        <a
          href={post.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ExternalLink size={15} />
          원문 보기 · {domainOf(post.external_url)}
        </a>
      ) : null}
      {post.tags.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <span key={t} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
              #{t}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
