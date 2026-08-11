import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { SectionTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import type { Role } from "@/lib/core/access";
import { ProfileForm } from "./profile-form";

const ROLE_LABEL: Record<Role, string> = {
  guest: "방문자",
  applicant: "지원자",
  student: "수강생",
  assistant: "조교",
  alumni: "동문",
  admin: "관리자",
};

// 로그인만 되어 있으면 누구나 자기 정보를 보고 고칠 수 있어야 한다 (수강 상태와 무관).
export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/portal/profile");

  const sb = await getSupabaseServer();
  const { data } = await sb
    .from("profiles")
    .select("name, company, title, phone, marketing_opt_in, directory_opt_in")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as {
    name: string | null;
    company: string | null;
    title: string | null;
    phone: string | null;
    marketing_opt_in: boolean | null;
    directory_opt_in: boolean | null;
  } | null;

  return (
    <PortalShell title="내 정보">
      <SectionTitle>내 정보</SectionTitle>
      <p className="mt-1 text-sm text-muted">프로필과 계정 설정을 관리합니다.</p>

      <div className="mt-6">
        <ProfileForm
          email={user.email}
          roleLabel={ROLE_LABEL[user.role] ?? user.role}
          initial={{
            name: profile?.name ?? user.name ?? "",
            company: profile?.company ?? "",
            title: profile?.title ?? "",
            phone: profile?.phone ?? "",
            marketing_opt_in: !!profile?.marketing_opt_in,
            directory_opt_in: !!profile?.directory_opt_in,
          }}
        />
      </div>
    </PortalShell>
  );
}
