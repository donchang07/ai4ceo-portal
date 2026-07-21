"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { notify } from "@/lib/notify";
import type { Application } from "@/lib/db/types";

// prd-v30-final §4 F3 — 상태 전환 알림톡(T-02/T-03) 문구 (PRD §9). 실채널 미가입 시
// notify()가 no-op(콘솔 로그 + notifications 큐 기록)으로 처리하는 것은 기존 동작 그대로다.
type NotifyTarget = Pick<Application, "name" | "phone" | "email" | "status">;

function templateFor(status: Application["status"]): { code: string; body: (a: NotifyTarget) => string } | null {
  if (status === "accepted") {
    return {
      code: "T-02",
      body: (a) => `${a.name}님, 축하합니다. AI4CEO 18기에 최종 합격하셨습니다. 아래 버튼에서 등록을 완료해 주세요.`,
    };
  }
  if (status === "rejected" || status === "waitlist") {
    return {
      code: "T-03",
      body: (a) => `${a.name}님, AI4CEO 18기 전형 결과를 안내드립니다. 자세한 내용은 이메일을 확인해 주세요.`,
    };
  }
  return null;
}

// Design Ref: PRD B-5/B-6 — 선발 관리 상태 변경. RLS(applications_admin, is_admin())
// enforces that only an authenticated admin session can actually update a row.
export async function updateApplicationStatus(id: string, status: Application["status"]) {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select("name, phone, email, status")
    .single();
  if (error) return { ok: false as const, message: error.message };

  const tpl = templateFor(status);
  if (tpl && data) {
    const app = data as NotifyTarget;
    await notify({
      channel: "alimtalk",
      templateCode: tpl.code,
      to: app.phone,
      body: tpl.body(app),
      payload: { name: app.name, status },
    });
  }

  revalidatePath("/admin/applications");
  revalidatePath("/admin");
  return { ok: true as const };
}
