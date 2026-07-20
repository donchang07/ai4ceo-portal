import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { Badge, SectionTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/db/auth";
import { isAdmin } from "@/lib/core/access";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import type { Post } from "@/lib/db/types";
import { ContentsManager } from "./contents-manager";

// Design Ref: PRD F-5 · /admin/contents — AI 뉴스·브리프 발행 (admin 전용, 이중 가드)
export default async function AdminContentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role)) redirect("/portal/cohort");

  let posts: Post[] = [];
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase.from("posts").select("*").order("published_at", { ascending: false });
    posts = (data as Post[]) ?? [];
  } catch {
    posts = [];
  }

  return (
    <AdminShell>
      <div className="flex items-center gap-3">
        <SectionTitle>AI 뉴스 · 브리프 관리</SectionTitle>
        <Badge tone="info">{posts.length}건</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">
        AI 뉴스와 의사결정 브리프를 작성·편집하고, 참고할 외부 웹사이트 URL을 함께 등록합니다. 저장 즉시 공개 /trends에 반영됩니다.
      </p>

      <div className="mt-6">
        <ContentsManager posts={posts} />
      </div>
    </AdminShell>
  );
}
