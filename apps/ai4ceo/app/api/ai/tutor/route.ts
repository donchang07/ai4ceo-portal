import { NextRequest } from "next/server";
import { buildTutorContext, buildSystemPrompt } from "@/lib/ai/context";
import { streamTutor, type TutorMessage } from "@/lib/ai/tutor";
import { getSupabaseServer } from "@/lib/db/supabase-server";

export const runtime = "nodejs";

// Design Ref: PRD 6.7 — AI 조교 streaming route + ai_question_logs recording
export async function POST(req: NextRequest) {
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

  const sources = await buildTutorContext();
  const system = buildSystemPrompt(sources);

  // best-effort log (schema may be unapplied)
  void logQuestion(messages[messages.length - 1]?.content ?? "", sources.slice(0, 3));

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
        model: process.env.AI_MODEL || "claude-sonnet-4-5",
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
