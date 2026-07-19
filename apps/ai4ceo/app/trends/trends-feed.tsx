"use client";

import { useState } from "react";
import { Lock, ExternalLink } from "lucide-react";
import { Badge, Button, Card, Chip } from "@/components/ui";
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
  const locked = post.audience !== "public";

  // (c) Locked card — student/alumni content on the public feed
  if (locked) {
    return (
      <Card className="overflow-hidden p-0">
        {post.thumbnail && (
          <div className="relative h-[130px] bg-gradient-to-br from-dark to-[#2a3a4d]">
            <div className="absolute left-4 top-4">
              <Badge tone="info">
                {post.audience === "alumni" ? "의사결정 브리프 · 동문 전용" : "수강생 전용"}
              </Badge>
            </div>
          </div>
        )}
        <div className="p-5">
          <h3 className="text-base font-semibold text-ink">{post.title}</h3>
          <p className="mt-1.5 select-none text-sm text-muted blur-[3px]" aria-hidden>
            {post.excerpt}
          </p>
          <div className="mt-4 flex flex-col items-start gap-3 rounded-control border border-cardline bg-surface-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
              <Lock size={15} className="text-faint" />
              수강생·수료생 공개 글 — 지원하고 열람하기
            </span>
            <Button href="/apply" variant="primary" className="shrink-0">
              지원하기
            </Button>
          </div>
        </div>
      </Card>
    );
  }

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
          <h3 className="text-base font-semibold text-ink">{post.title}</h3>
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
      <h3 className="mt-3 text-base font-semibold text-ink">{post.title}</h3>
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
