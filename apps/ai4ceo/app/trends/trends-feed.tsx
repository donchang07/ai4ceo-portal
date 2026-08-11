"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge, Card, Chip } from "@/components/ui";
import type { Post } from "@/lib/db/types";

const CATEGORY_LABEL: Record<Post["category"], string> = {
  ai_news: "AI 뉴스",
  tech: "기술",
  ax: "기업 AX",
};

const FILTERS: { key: "all" | Post["category"]; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "ai_news", label: "AI 뉴스" },
  { key: "tech", label: "기술" },
  { key: "ax", label: "기업 AX" },
];

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function TagChips({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted"
        >
          #{t}
        </span>
      ))}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  // (a) Thumbnail card
  if (post.thumbnail) {
    return (
      <Card className="overflow-hidden p-0">
        <div className="relative h-[130px] bg-gradient-to-br from-dark to-[#2a3a4d]">
          <div className="absolute left-4 top-4">
            <Badge tone="info">의사결정 브리프</Badge>
          </div>
        </div>
        <div className="p-5">
          <Link href={`/trends/${post.id}`} className="hover:underline">
            <h3 className="text-base font-semibold text-ink">{post.title}</h3>
          </Link>
          <p className="mt-1.5 text-sm text-muted">{post.excerpt}</p>
          <TagChips tags={post.tags} />
        </div>
      </Card>
    );
  }

  // (b) External / text card
  return (
    <Card>
      <Badge tone="neutral">{CATEGORY_LABEL[post.category]}</Badge>
      <Link href={`/trends/${post.id}`} className="hover:underline">
        <h3 className="mt-3 text-base font-semibold text-ink">{post.title}</h3>
      </Link>
      <p className="mt-1.5 text-sm text-muted">{post.excerpt}</p>
      {post.external_url && (
        <a
          href={post.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
        >
          <ExternalLink size={14} />
          {domainOf(post.external_url)}
        </a>
      )}
      <TagChips tags={post.tags} />
    </Card>
  );
}

export function TrendsFeed({ posts }: { posts: Post[] }) {
  const [filter, setFilter] = useState<"all" | Post["category"]>("all");

  const visible = filter === "all" ? posts : posts.filter((p) => p.category === filter);

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {visible.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {visible.length === 0 && (
          <p className="py-12 text-center text-sm text-faint">해당 카테고리의 글이 아직 없습니다.</p>
        )}
      </div>
    </>
  );
}
