"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/db/auth";
import { isAdmin } from "@/lib/core/access";
import { getSupabaseServer } from "@/lib/db/supabase-server";

// Design Ref: PRD F-5 · /admin/contents — AI 뉴스·브리프 입력/편집.
// 쓰기는 posts_admin(is_admin()) RLS로 보호되지만, 서버 액션에서도 admin을 재확인한다.
const postSchema = z.object({
  id: z.string().uuid().optional(),
  board: z.enum(["ai_trend", "brief", "notice"]),
  title: z.string().trim().min(1, "제목을 입력해 주세요."),
  category: z.enum(["ai_news", "tech", "ax"]),
  audience: z.enum(["public", "student", "alumni", "admin_only"]),
  excerpt: z.string().trim().max(500).optional().default(""),
  body_mdx: z.string().trim().optional().default(""),
  external_url: z
    .string()
    .trim()
    .url("참고 URL 형식이 올바르지 않습니다.")
    .optional()
    .or(z.literal("")),
  tags: z.string().trim().optional().default(""),
});

export type PostFormResult = { ok: true } | { ok: false; message: string };

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) throw new Error("관리자 권한이 필요합니다.");
  return user;
}

function parseTags(raw: string): string[] {
  return raw
    .split(/[,#\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function savePost(input: unknown): Promise<PostFormResult> {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "입력을 확인해 주세요." };
  }
  const user = await assertAdmin();
  const supabase = await getSupabaseServer();
  const v = parsed.data;

  const row = {
    board: v.board,
    title: v.title,
    category: v.category,
    audience: v.audience,
    excerpt: v.excerpt || null,
    body_mdx: v.body_mdx || null,
    external_url: v.external_url ? v.external_url : null,
    tags: parseTags(v.tags),
  };

  const { error } = v.id
    ? await supabase.from("posts").update(row).eq("id", v.id)
    : await supabase.from("posts").insert({ ...row, author_id: user.id });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/contents");
  revalidatePath("/trends");
  return { ok: true };
}

export async function deletePost(id: string): Promise<PostFormResult> {
  await assertAdmin();
  const supabase = await getSupabaseServer();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/contents");
  revalidatePath("/trends");
  return { ok: true };
}
