"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { getCurrentUser } from "@/lib/db/auth";
import { isAdmin, canAccessLms } from "@/lib/core/access";
import { buildTutorContext, buildSystemPrompt, ragChunksToSources } from "@/lib/ai/context";
import { retrieveRagChunks } from "@/lib/ai/retrieval";
import { answerTutorOnce } from "@/lib/ai/tutor";
import { COHORT_18 } from "@/lib/core/constants";

// Design Ref: D-10/D-22 — 세션 Q&A. RLS(sq_insert/sa_insert)가 소속 기수 검사를 강제하지만,
// 서버 액션에서도 접근을 한 번 더 확인해 UX 상 즉시 리다이렉트되도록 한다.

export async function askQuestion(sessionId: string, cohortId: string, body: string, videoPositionSec?: number) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, message: "로그인이 필요합니다." };
  const text = body.trim();
  if (!text) return { ok: false as const, message: "질문을 입력해 주세요." };

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from("session_questions").insert({
    session_id: sessionId,
    cohort_id: cohortId || COHORT_18.id,
    author_id: user.id,
    author_name: user.name,
    body: text,
    video_position_sec: videoPositionSec ?? null,
  });
  if (error) return { ok: false as const, message: error.message };
  revalidatePath(`/portal/sessions/${sessionId}`);
  return { ok: true as const };
}

export async function answerQuestion(sessionId: string, questionId: string, body: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, message: "로그인이 필요합니다." };
  const text = body.trim();
  if (!text) return { ok: false as const, message: "답변을 입력해 주세요." };

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from("session_answers").insert({
    question_id: questionId,
    author_id: user.id,
    author_name: user.name,
    body: text,
    is_instructor: isAdmin(user.role) || user.role === "assistant",
    is_ai: false,
  });
  if (error) return { ok: false as const, message: error.message };
  revalidatePath(`/portal/sessions/${sessionId}`);
  return { ok: true as const };
}

// RAG 조교가 특정 질문에 답변을 생성해 스레드에 저장 — "RAG로 학습된 AI 조교" 테스트 경로.
export async function answerWithAi(sessionId: string, questionId: string, questionBody: string) {
  const user = await getCurrentUser();
  if (!user || (!isAdmin(user.role) && !canAccessLms(user.role, user.enrollmentStatus))) {
    return { ok: false as const, message: "권한이 없습니다." };
  }

  const [curriculum, chunks] = await Promise.all([
    buildTutorContext(),
    retrieveRagChunks(questionBody),
  ]);
  const system = buildSystemPrompt([...ragChunksToSources(chunks), ...curriculum]);
  const answer = await answerTutorOnce({ system, question: questionBody });

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from("session_answers").insert({
    question_id: questionId,
    author_id: user.id,
    author_name: "AI 조교",
    body: answer,
    is_instructor: false,
    is_ai: true,
  });
  if (error) return { ok: false as const, message: error.message };
  revalidatePath(`/portal/sessions/${sessionId}`);
  return { ok: true as const };
}
