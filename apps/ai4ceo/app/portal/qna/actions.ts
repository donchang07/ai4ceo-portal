"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { getCurrentUser } from "@/lib/db/auth";
import { isAdmin } from "@/lib/core/access";
import { buildTutorContext, buildSystemPrompt, ragChunksToSources } from "@/lib/ai/context";
import { retrieveRagChunks } from "@/lib/ai/retrieval";
import { answerTutorOnce } from "@/lib/ai/tutor";

// Design Ref: prd-v3-cycle3.design.md §4 — D-10 일반 Q&A 게시판.
// 세션별 Q&A(app/portal/sessions/[id]/actions.ts)와 별개 파일 — session_id=null로 insert.

export async function askGeneralQuestion(cohortId: string, body: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, message: "로그인이 필요합니다." };
  const text = body.trim();
  if (!text) return { ok: false as const, message: "질문을 입력해 주세요." };

  const supabase = await getSupabaseServer();
  const { error } = await supabase.from("session_questions").insert({
    session_id: null,
    cohort_id: cohortId,
    author_id: user.id,
    author_name: user.name,
    body: text,
  });
  if (error) return { ok: false as const, message: error.message };
  revalidatePath("/portal/qna");
  return { ok: true as const };
}

export async function answerGeneralQuestion(questionId: string, body: string) {
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
  revalidatePath("/portal/qna");
  return { ok: true as const };
}

export async function answerGeneralWithAi(questionId: string, questionBody: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, message: "권한이 없습니다." };

  const [curriculum, chunks] = await Promise.all([buildTutorContext(), retrieveRagChunks(questionBody)]);
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
  revalidatePath("/portal/qna");
  return { ok: true as const };
}
