"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { COHORT_18 } from "@/lib/core/constants";

// Design Ref: PRD D-29 — 세션 삽입. RLS(sessions_admin, is_admin())가 admin만 쓰기 허용.
export async function insertSession() {
  const supabase = await getSupabaseServer();
  const now = new Date();

  const { data: maxRow } = await supabase
    .from("sessions")
    .select("sort_order")
    .eq("cohort_id", COHORT_18.id)
    .order("sort_order", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("sessions").insert({
    cohort_id: COHORT_18.id,
    week_no: null,
    title: "새 세션",
    type: "special",
    starts_at: now.toISOString(),
    ends_at: new Date(now.getTime() + 3 * 3600 * 1000).toISOString(),
    description: "",
    is_published: false,
    sort_order: nextOrder,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/curriculum");
}

// Design Ref: PRD D-29 — 세션 순서 변경 (드래그 앤 드롭)
export async function reorderSessions(orderedIds: string[]) {
  const supabase = await getSupabaseServer();
  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from("sessions").update({ sort_order: index }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false as const, message: failed.error.message };
  revalidatePath("/admin/curriculum");
  return { ok: true as const };
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

// Design Ref: D-3/D-21 — 강의 영상 연결. Zoom 녹화본을 Drive/YouTube에 올리고 URL을 세션에 붙인다.
// (실제 파일 업로드는 Drive/YouTube에서, 포탈은 URL 연결·권한 표시·재생 담당.)
export async function setSessionVideo(sessionId: string, url: string, title: string) {
  const supabase = await getSupabaseServer();
  const trimmed = url.trim();

  const { data: existing } = await supabase
    .from("videos")
    .select("id")
    .eq("session_id", sessionId)
    .limit(1)
    .maybeSingle();

  if (!trimmed) {
    if (existing) await supabase.from("videos").delete().eq("id", existing.id);
    revalidatePath("/admin/curriculum");
    revalidatePath(`/portal/sessions/${sessionId}`);
    return { ok: true as const };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const row = {
    session_id: sessionId,
    google_drive_url: trimmed,
    title: title.trim() || "강의 영상",
    visibility: "cohort_readonly" as const,
    uploaded_by: user?.id ?? null,
    published_at: new Date().toISOString(),
  };
  const { error } = existing
    ? await supabase.from("videos").update(row).eq("id", existing.id)
    : await supabase.from("videos").insert(row);
  if (error) return { ok: false as const, message: error.message };

  revalidatePath("/admin/curriculum");
  revalidatePath(`/portal/sessions/${sessionId}`);
  return { ok: true as const };
}

// Design Ref: D-5 — 강의자료 첨부(제목 + 링크/파일 URL).
export async function addMaterial(sessionId: string, title: string, url: string) {
  const supabase = await getSupabaseServer();
  const t = title.trim();
  if (!t) return { ok: false as const, message: "자료 제목을 입력해 주세요." };
  const { error } = await supabase.from("materials").insert({
    session_id: sessionId,
    title: t,
    file_path: url.trim(),
    version: 1,
  });
  if (error) return { ok: false as const, message: error.message };
  revalidatePath("/admin/curriculum");
  revalidatePath(`/portal/sessions/${sessionId}`);
  return { ok: true as const };
}

export async function deleteMaterial(materialId: string, sessionId: string) {
  const supabase = await getSupabaseServer();
  const { error } = await supabase.from("materials").delete().eq("id", materialId);
  if (error) return { ok: false as const, message: error.message };
  revalidatePath("/admin/curriculum");
  revalidatePath(`/portal/sessions/${sessionId}`);
  return { ok: true as const };
}
