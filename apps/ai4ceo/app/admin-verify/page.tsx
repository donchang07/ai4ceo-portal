import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/db/auth";
import { isAdmin } from "@/lib/core/access";
import { VerifyForm } from "./verify-form";

// /admin 레이아웃 밖에 둔다 — 2단계 인증 가드의 리디렉트 대상이므로 같은 가드에 걸리면 안 된다.
export default async function AdminVerifyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdmin(user.role)) redirect("/portal/cohort");

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-5">
      <div className="w-full max-w-sm rounded-[15px] border border-hairline bg-surface p-7">
        <VerifyForm />
      </div>
    </div>
  );
}
