import { NextRequest } from "next/server";
import { buildTutorContext, buildSystemPrompt, ragChunksToSources } from "@/lib/ai/context";
import { retrieveRagChunks } from "@/lib/ai/retrieval";
import { streamTutor, AI_MODEL, type TutorMessage } from "@/lib/ai/tutor";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { getCurrentUser } from "@/lib/db/auth";
import { canAccessLms, isAdmin } from "@/lib/core/access";

export const runtime = "nodejs";
export const maxDuration = 300;

// Design Ref: PRD 6.7 — AI 조교 streaming route: RAG(pgvector) retrieval + Claude Fable 5
export async function POST(req: NextRequest) {
  // AI 조교는 재학생/조교/관리자 전용 (PRD 1.7 status-gated)
  const user = await getCurrentUser();
  if (!user || (!isAdmin(user.role) && !canAccessLms(user.role, user.enrollmentStatus))) {
    return new Response("AI 조교는 재학생 전용입니다.", { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    messages?: TutorMessage[];
    question?: string;
  };

  const messages: TutorMessage[] =
    body.messages ??
    (body.question ? [{ role: "user", content: body.question }] : []);

  if (messages.length === 0) {
    return new Response("질문이 없습니다.", { status: 400 });
  }

  const lastQuestion = messages[messages.length - 1]?.content ?? "";
  const [curriculumSources, ragChunks] = await Promise.all([
    buildTutorContext(),
    retrieveRagChunks(lastQuestion),
  ]);
  const sources = [...ragChunksToSources(ragChunks), ...curriculumSources];
  const system = buildSystemPrompt(sources);

  // best-effort log (schema may be unapplied)
  void logQuestion(lastQuestion, sources.slice(0, 3));

  const stream = await streamTutor({ system, messages });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

async function logQuestion(question: string, sources: { type: string; id: string; title: string }[]) {
  try {
    const sb = await getSupabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    const { data: log } = await sb
      .from("ai_question_logs")
      .insert({
        user_id: user?.id ?? null,
        question,
        answer: "",
        topic: "other",
        model: AI_MODEL,
        context_refs: sources.map((s) => ({ type: s.type, id: s.id, title: s.title })),
        status: "answered",
      })
      .select("id")
      .maybeSingle();
    if (log?.id) {
      await sb.from("ai_context_sources").insert(
        sources.map((s) => ({
          ai_question_log_id: log.id,
          source_type: s.type,
          source_id: s.id,
          source_title: s.title,
        })),
      );
    }
  } catch {
    /* ignore */
  }
}
