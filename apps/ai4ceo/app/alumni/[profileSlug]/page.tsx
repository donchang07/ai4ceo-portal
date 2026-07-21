import { PublicHeader } from "@/components/public-header";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { PublicProfile, type PublicProfileRow } from "./public-profile";

// Design Ref: prd-v3-cycle5.design.md §5 — 공개 프로필.
// [profileSlug]는 alumni_profiles.user_id (cycle3 D-1과 동일하게 별도 slug 컬럼 없음).
// 하드 게이트 없음 — RLS가 비공개 행을 null로 걸러주면 티저를 렌더한다(리다이렉트 없음).
export default async function PublicAlumniProfilePage({ params }: { params: Promise<{ profileSlug: string }> }) {
  const { profileSlug } = await params;

  let profile: PublicProfileRow | null = null;
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb.from("alumni_profiles").select("*").eq("user_id", profileSlug).maybeSingle();
    profile = (data as PublicProfileRow) ?? null;
  } catch {
    /* 스키마 미적용 환경 */
  }

  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <main className="mx-auto max-w-[640px] px-5 py-10">
        <PublicProfile profile={profile} />
      </main>
    </div>
  );
}
