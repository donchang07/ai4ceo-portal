import { PublicHeader } from "@/components/public-header";
import { SectionTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/db/auth";
import { getPosts } from "@/lib/db/queries";
import { TrendsFeed } from "./trends-feed";

export default async function TrendsPage() {
  const [posts, user] = await Promise.all([getPosts(), getCurrentUser()]);

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader user={user} />
      <main className="mx-auto max-w-[720px] px-5 py-8">
        <SectionTitle>AI 브리프</SectionTitle>
        <p className="mt-2 text-sm text-muted">
          CEO가 알아야 할 AI 흐름과 의사결정 브리프입니다.
        </p>
        <TrendsFeed posts={posts} />
      </main>
    </div>
  );
}
