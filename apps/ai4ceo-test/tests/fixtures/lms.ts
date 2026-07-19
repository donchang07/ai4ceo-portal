// FR-3: LMS 픽스처 — 데모 세션에 영상 1개 + 자료 2개 시드, 테스트가 만든 질문/답변 정리(service role).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const DEMO_SESSION_ID = "ed04829b-148e-4ae8-8462-cf80b41666db";
const COHORT_18_ID = "00000000-0000-0000-0000-0000000000c1";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function service(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// 데모 세션에 영상 1개 보장(없으면 삽입). 반환: 영상 존재 여부.
export async function seedDemoVideo(): Promise<boolean> {
  const sb = service();
  const { data: existing } = await sb
    .from("videos")
    .select("id")
    .eq("session_id", DEMO_SESSION_ID)
    .limit(1)
    .maybeSingle();
  if (existing) return true;
  const { error } = await sb.from("videos").insert({
    session_id: DEMO_SESSION_ID,
    google_drive_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "[테스트] 1주차 강의 영상",
    visibility: "cohort_readonly",
  });
  return !error;
}

// 데모 세션에 자료 2개 보장(부족하면 채움).
export async function seedDemoMaterials(): Promise<number> {
  const sb = service();
  const { data: existing } = await sb.from("materials").select("id").eq("session_id", DEMO_SESSION_ID);
  const have = existing?.length ?? 0;
  const need = Math.max(0, 2 - have);
  for (let i = 0; i < need; i++) {
    await sb.from("materials").insert({
      session_id: DEMO_SESSION_ID,
      title: `[테스트] 강의자료 ${have + i + 1}`,
      file_path: "https://example.com/test-material.pdf",
      version: 1,
    });
  }
  return have + need;
}

// service role 로 질문 생성(단언용 시드). 반환 question id.
export async function seedQuestion(authorId: string | null, body: string): Promise<string | null> {
  const sb = service();
  const { data, error } = await sb
    .from("session_questions")
    .insert({
      session_id: DEMO_SESSION_ID,
      cohort_id: COHORT_18_ID,
      author_id: authorId,
      author_name: "[테스트] 질문자",
      body,
    })
    .select("id")
    .maybeSingle();
  if (error) return null;
  return data?.id ?? null;
}

// 테스트가 생성한 질문/답변 정리. 본문이 [테스트] 로 시작하거나 지정 id들 삭제.
export async function cleanupTestQa(questionIds: string[] = []): Promise<void> {
  const sb = service();
  // 지정된 질문의 답변 → 질문 삭제
  if (questionIds.length) {
    await sb.from("session_answers").delete().in("question_id", questionIds);
    await sb.from("session_questions").delete().in("id", questionIds);
  }
  // 마커 기반 정리(데모 세션 한정)
  const { data: marked } = await sb
    .from("session_questions")
    .select("id")
    .eq("session_id", DEMO_SESSION_ID)
    .like("body", "[테스트]%");
  const ids = (marked ?? []).map((r) => r.id);
  if (ids.length) {
    await sb.from("session_answers").delete().in("question_id", ids);
    await sb.from("session_questions").delete().in("id", ids);
  }
}

// 특정 질문에 달린 답변 조회(단언용).
export async function getAnswers(questionId: string) {
  const sb = service();
  const { data } = await sb
    .from("session_answers")
    .select("id, body, is_ai, is_instructor, author_name, created_at")
    .eq("question_id", questionId)
    .order("created_at", { ascending: true });
  return data ?? [];
}
