import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { SUPABASE_CONFIGURED } from "@/lib/db/env";
import { isAdmin, type Role } from "@/lib/core/access";
import { isAdminDeviceGuardEnabled, isAdminMfaRequired, isRegisteredDevice } from "@/lib/db/admin-device";

// 기기 등록(/admin-device)과 2단계 인증(/admin-verify) 화면은 이 레이아웃 밖에 둔다 —
// 리디렉트 대상이 같은 가드에 걸리면 무한 루프로 관리자가 영구 차단될 수 있기 때문이다.
//
// 보안 설정 화면만 예외가 필요하다: TOTP를 처음 등록하려면 2단계 인증 전에 들어갈 수 있어야 한다.
const MFA_EXEMPT = "/admin/security";

// Design Ref: PRD 1.7/2.2 — /admin/* requires role=admin (server-side gate)
// 여기에 더해 등록된 기기 + (선택적으로) 2단계 인증을 요구한다.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!SUPABASE_CONFIGURED) return children;

  // 사용자 식별은 미들웨어가 JWT를 검증한 뒤 세워준 헤더를 쓴다.
  // 여기서 auth.getUser()를 다시 부르면 관리자 화면마다 인증 서버 왕복이 한 번씩 더 생기고,
  // 회전된 갱신 토큰을 두 번 쓰게 되어 세션이 끊기는 원인이 됐다.
  const requestHeaders = await headers();
  const userId = requestHeaders.get("x-ai4ceo-user-id");
  if (!userId) redirect("/login?next=/admin");

  const supabase = await getSupabaseServer();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!isAdmin(profile?.role as Role | undefined)) redirect("/portal/cohort");

  if (isAdminDeviceGuardEnabled()) {
    if (!(await isRegisteredDevice(userId))) redirect("/admin-device");

    if (isAdminMfaRequired() && requestHeaders.get("x-ai4ceo-path") !== MFA_EXEMPT) {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") redirect("/admin-verify");
    }
  }

  return children;
}
