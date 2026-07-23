"use server";

import { revalidatePath } from "next/cache";
import { requireLmsAccess } from "@/lib/db/auth";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { notify } from "@/lib/notify";

// Design Ref: prd-v3-m2-booking.design.md §5 — /portal/coaching·/portal/supplement 공용 예약 액션.

type TemplateCode = "T-12" | "T-13";

const TEMPLATE_BODY: Record<TemplateCode, (name: string, when: string) => string> = {
  "T-12": (name, when) => `${name}님, 1:1 코칭 예약이 확정되었습니다. 일시: ${when}`,
  "T-13": (name, when) =>
    `${name}님, AI4CEO 오프라인 보충 교육 세션이 ${when}에 진행됩니다. 컴퓨터 실습이 어려우시면 신청 후 참석해 주세요.`,
};

export async function bookSession(sessionId: string, templateCode: TemplateCode) {
  const user = await requireLmsAccess();
  const sb = await getSupabaseServer();

  const { data: session, error: sessionError } = await sb
    .from("sessions")
    .select("starts_at, place, zoom_url, type")
    .eq("id", sessionId)
    .single();
  if (sessionError || !session) return { ok: false as const, message: "세션을 찾을 수 없습니다." };

  const { error } = await sb
    .from("session_bookings")
    .upsert({ session_id: sessionId, user_id: user.id, status: "booked" }, { onConflict: "session_id,user_id" });
  if (error) return { ok: false as const, message: error.message };

  const when = new Date(session.starts_at as string).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const method = (session.place as string | null) ?? (session.zoom_url ? "Zoom" : "");

  await notify({
    channel: "alimtalk",
    templateCode,
    to: user.email,
    userId: user.id,
    body: TEMPLATE_BODY[templateCode](user.name, method ? `${when} ${method}` : when),
    payload: { sessionId, method },
  });

  revalidatePath(templateCode === "T-12" ? "/portal/coaching" : "/portal/supplement");
  return { ok: true as const };
}

export async function cancelBooking(sessionId: string, path: "/portal/coaching" | "/portal/supplement") {
  const user = await requireLmsAccess();
  const sb = await getSupabaseServer();
  const { error } = await sb
    .from("session_bookings")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .eq("user_id", user.id);
  if (error) return { ok: false as const, message: error.message };
  revalidatePath(path);
  return { ok: true as const };
}
