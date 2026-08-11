import { AdminShell } from "@/components/admin-shell";
import { SectionTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { isAdminDeviceGuardEnabled, isAdminMfaRequired, listAdminDevices } from "@/lib/db/admin-device";
import { DeviceList } from "./device-list";
import { TotpSetup } from "./totp-setup";

export default async function AdminSecurityPage() {
  const user = await getCurrentUser();
  const devices = user ? await listAdminDevices(user.id) : [];

  const supabase = await getSupabaseServer();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totpEnrolled = !!factors?.totp?.some((f) => f.status === "verified");

  return (
    <AdminShell>
      <SectionTitle>보안 설정</SectionTitle>
      <p className="mt-1 text-sm text-muted">
        관리자 화면은 아래에 등록된 기기에서만 열립니다.
        {isAdminMfaRequired() && " 여기에 더해 로그인할 때마다 2단계 인증을 거칩니다."}
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2 lg:items-start">
        <DeviceList devices={devices} guardEnabled={isAdminDeviceGuardEnabled()} />
        <TotpSetup enrolled={totpEnrolled} required={isAdminMfaRequired()} />
      </div>
    </AdminShell>
  );
}
