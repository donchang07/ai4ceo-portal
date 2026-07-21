import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { getPost } from "@/lib/db/queries";
import { getCurrentUser } from "@/lib/db/auth";
import { canAccessLms, canAccessAlumni, isAdmin } from "@/lib/core/access";
import { PostDetail } from "./post-detail";

// Design Ref: prd-v3-cycle3.design.md §3 — F-1·F-5·F-6 (SCR /trends/[slug]).
// [slug] 파라미터는 실제로 posts.id (Plan D-1 — 별도 slug 컬럼 없음).
export default async function TrendDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const user = await getCurrentUser();
  const canView =
    post.audience === "public" ||
    (user &&
      (isAdmin(user.role) ||
        (post.audience === "student" && canAccessLms(user.role, user.enrollmentStatus)) ||
        (post.audience === "alumni" && canAccessAlumni(user.role, user.enrollmentStatus))));

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <main className="mx-auto max-w-[720px] px-5 py-8">
        <PostDetail post={post} canView={Boolean(canView)} />
      </main>
    </div>
  );
}
