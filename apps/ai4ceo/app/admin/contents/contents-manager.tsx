"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge, Button, Card, CardTitle, Input, Textarea } from "@/components/ui";
import type { Post } from "@/lib/db/types";
import { deletePost, savePost } from "./actions";

const CATEGORY_LABEL: Record<Post["category"], string> = {
  ai_news: "AI 뉴스",
  tech: "기술",
  ax: "기업 AX",
};
const AUDIENCE_LABEL: Record<Post["audience"], string> = {
  public: "전체 공개",
  student: "수강생",
  alumni: "수료생",
  admin_only: "관리자만",
};
const BOARD_LABEL: Record<"ai_trend" | "brief" | "notice", string> = {
  ai_trend: "AI 트렌드",
  brief: "의사결정 브리프",
  notice: "공지",
};

type FormState = {
  id?: string;
  board: "ai_trend" | "brief" | "notice";
  title: string;
  category: Post["category"];
  audience: Post["audience"];
  excerpt: string;
  body_mdx: string;
  external_url: string;
  tags: string;
};

const EMPTY: FormState = {
  board: "ai_trend",
  title: "",
  category: "ai_news",
  audience: "public",
  excerpt: "",
  body_mdx: "",
  external_url: "",
  tags: "",
};

const selectClass =
  "min-h-10 rounded-control border border-cardline bg-surface px-3 text-sm text-ink outline-none focus:border-primary";

export function ContentsManager({ posts }: { posts: Post[] }) {
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setError(null);
    setForm({ ...EMPTY });
  }

  function openEdit(post: Post) {
    setError(null);
    setForm({
      id: post.id,
      board: (["ai_trend", "brief", "notice"].includes(post.board) ? post.board : "ai_trend") as FormState["board"],
      title: post.title,
      category: post.category,
      audience: post.audience,
      excerpt: post.excerpt ?? "",
      body_mdx: "",
      external_url: post.external_url ?? "",
      tags: post.tags.join(", "),
    });
  }

  function submit() {
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const res = await savePost(form);
      if (res.ok) setForm(null);
      else setError(res.message);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deletePost(id);
      if (!res.ok) setError(res.message);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="primary" onClick={openNew}>
          <Plus size={16} /> 새 글 작성
        </Button>
      </div>

      {form ? (
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>{form.id ? "글 편집" : "새 글 작성"}</CardTitle>
            <button onClick={() => setForm(null)} aria-label="닫기" className="text-muted hover:text-ink">
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="제목"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                게시판
                <select
                  value={form.board}
                  onChange={(e) => setForm({ ...form, board: e.target.value as FormState["board"] })}
                  className={selectClass}
                >
                  <option value="ai_trend">AI 트렌드</option>
                  <option value="brief">의사결정 브리프</option>
                  <option value="notice">공지</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                분류
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Post["category"] })}
                  className={selectClass}
                >
                  <option value="ai_news">AI 뉴스</option>
                  <option value="tech">기술</option>
                  <option value="ax">기업 AX</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                공개 범위
                <select
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value as Post["audience"] })}
                  className={selectClass}
                >
                  <option value="public">전체 공개</option>
                  <option value="student">수강생</option>
                  <option value="alumni">수료생</option>
                  <option value="admin_only">관리자만</option>
                </select>
              </label>
            </div>
            <Textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="요약 (목록에 노출)"
            />
            <Textarea
              rows={5}
              value={form.body_mdx}
              onChange={(e) => setForm({ ...form, body_mdx: e.target.value })}
              placeholder="본문 (선택, MDX)"
            />
            <label className="flex flex-col gap-1 text-xs font-medium text-muted">
              참고 웹사이트 URL
              <Input
                type="url"
                value={form.external_url}
                onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                placeholder="https://example.com/article"
              />
            </label>
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="태그 (쉼표로 구분: 생성형AI, 규제)"
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex gap-2">
              <Button variant="primary" onClick={submit} disabled={pending}>
                {pending ? "저장 중…" : "저장"}
              </Button>
              <Button variant="outline" onClick={() => setForm(null)}>
                취소
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3">
        {posts.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">등록된 글이 없습니다. 첫 번째 AI 뉴스를 작성해 보세요.</p>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="info">{BOARD_LABEL[post.board as "ai_trend" | "brief" | "notice"] ?? post.board}</Badge>
                    <Badge tone="neutral">{CATEGORY_LABEL[post.category]}</Badge>
                    <Badge tone={post.audience === "public" ? "done" : "progress"}>{AUDIENCE_LABEL[post.audience]}</Badge>
                  </div>
                  <CardTitle className="mt-2">{post.title}</CardTitle>
                  {post.excerpt ? <p className="mt-1 text-sm text-muted">{post.excerpt}</p> : null}
                  {post.external_url ? (
                    <a
                      href={post.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink size={13} /> {post.external_url}
                    </a>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button variant="outline" onClick={() => openEdit(post)}>
                    <Pencil size={14} /> 편집
                  </Button>
                  <Button variant="ghost" onClick={() => remove(post.id)} disabled={pending}>
                    <Trash2 size={14} /> 삭제
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
