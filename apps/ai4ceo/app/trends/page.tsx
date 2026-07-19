import { PublicHeader } from "@/components/public-header";
import { SectionTitle } from "@/components/ui";
import { getPosts } from "@/lib/db/queries";
import { TrendsFeed } from "./trends-feed";

export default async function TrendsPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <main className="mx-auto max-w-[720px] px-5 py-8">
        <SectionTitle>AI 뉴스 · 브리프</SectionTitle>
        <p className="mt-2 text-sm text-muted">
          CEO가 알아야 할 AI 흐름과 의사결정 브리프. 일부 글은 수강생·수료생에게만 공개됩니다.
        </p>
        <TrendsFeed posts={posts} />
      </main>
    </div>
  );
}
