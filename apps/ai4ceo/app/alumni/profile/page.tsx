import { requireAlumniAccess } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { ProfileEditor, type AlumniProfileRow } from "./profile-editor";

// Design Ref: prd-v3-cycle5.design.md §3 — E-6 수료생 선택형 공개 프로필
export default async function AlumniProfilePage() {
  const user = await requireAlumniAccess();

  let profile: AlumniProfileRow | null = null;
  let defaultTitle = "";
  let defaultCompany = "";
  let defaultCohortLabel = "";
  try {
    const sb = await getSupabaseServer();
    const [{ data }, { data: selfProfile }] = await Promise.all([
      sb.from("alumni_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      sb.from("profiles").select("title, company").eq("id", user.id).maybeSingle(),
    ]);
    profile = (data as AlumniProfileRow) ?? null;
    defaultTitle = (selfProfile?.title as string) ?? "";
    defaultCompany = (selfProfile?.company as string) ?? "";

    if (user.cohortId) {
      const { data: cohort } = await sb.from("cohorts").select("name").eq("id", user.cohortId).maybeSingle();
      defaultCohortLabel = (cohort?.name as string) ?? "";
    }
  } catch {
    /* 스키마 미적용 환경 — 빈 폼으로 렌더 */
  }

  return (
    <ProfileEditor
      userId={user.id}
      profile={profile}
      defaults={{
        display_name: user.name,
        job_title: defaultTitle,
        company_name: defaultCompany,
        cohort_label: defaultCohortLabel,
      }}
    />
  );
}
