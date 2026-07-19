"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { COHORT_18 } from "@/lib/core/constants";

// Design Ref: PRD D-29 — 세션 삽입. RLS(sessions_admin, is_admin())가 admin만 쓰기 허용.
export async function insertSession() {
  const supabase = await getSupabaseServer();
  const now = new Date();
  const { error } = await supabase.from("sessions").insert({
    cohort_id: COHORT_18.id,
    week_no: null,
    title: "새 세션",
    type: "special",
    starts_at: now.toISOString(),
    ends_at: new Date(now.getTime() + 3 * 3600 * 1000).toISOString(),
    description: "",
    is_published: false,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/curriculum");
}

// Design Ref: PRD D-28/D-15 — 인라인 편집은 저장 즉시 반영 + 변경 이력 자동 기록
export async function saveSession(id: string, title: string, description: string) {
  const supabase = await getSupabaseServer();

  const { data: before } = await supabase
    .from("sessions")
    .select("title, description")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("sessions").update({ title, description }).eq("id", id);
  if (error) return { ok: false as const, message: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("curriculum_change_logs").insert({
    cohort_id: COHORT_18.id,
    entity_type: "session",
    entity_id: id,
    changed_by: user?.id ?? null,
    change_summary: "본문 수정",
    before_json: before ?? {},
    after_json: { title, description },
    notify_students: false,
  });

  revalidatePath("/admin/curriculum");
  return { ok: true as const };
}
