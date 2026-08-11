import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/db/auth";
import { isAdmin } from "@/lib/core/access";
import { listAdminDevices } from "@/lib/db/admin-device";
import { DeviceForm } from "./device-form";

// /admin 레이아웃 밖에 둔다 — 기기 가드의 리디렉트 대상이므로 같은 가드에 걸리면 안 된다.
// 대신 관리자 여부는 이 화면에서 직접 확인한다.
export default async function AdminDevicePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin-device");
  if (!isAdmin(user.role)) redirect("/portal/cohort");

  const devices = await listAdminDevices(user.id);

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-5">
      <div className="w-full max-w-md rounded-[15px] border border-hairline bg-surface p-7">
        <DeviceForm registered={devices.length > 0} />
      </div>
    </div>
  );
}
