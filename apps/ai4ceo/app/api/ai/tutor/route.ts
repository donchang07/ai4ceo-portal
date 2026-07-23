import { NextRequest } from "next/server";
import { buildTutorContext, buildSystemPrompt, ragChunksToSources } from "@/lib/ai/context";
import { retrieveRagChunks } from "@/lib/ai/retrieval";
import { streamTutor, AI_MODEL, type TutorMessage } from "@/lib/ai/tutor";
import { getSupabaseServer } from "@/lib/db/supabase-server";
import { getCurrentUser } from "@/lib/db/auth";
import { canAccessLms, isAdmin } from "@/lib/core/access";
import type { EnrollmentStatus, Role } from "@/lib/core/access";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/db/env";

export const runtime = "nodejs";
export const maxDuration = 300;

// Design Ref: PRD 6.7 — AI 조교 streaming route: RAG(pgvector) retrieval + Claude Fable 5
export async function POST(req: NextRequest) {
  // AI 조교는 재학생/조교/관리자 전용 (PRD 1.7 status-gated)
  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const user =
    (await getCurrentUser()) ??
    (bearer ? await getTokenIdentity(bearer) : null) ??
    (await getCookieIdentity(req));
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
      "Content-Encoding": "none",
      "X-Accel-Buffering": "no",
    },
  });
}

async function getCookieIdentity(req: NextRequest): Promise<{
  role: Role;
  enrollmentStatus: EnrollmentStatus | null;
} | null> {
  try {
    const authCookies = req.cookies
      .getAll()
      .filter(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name))
      .sort((a, b) => {
        const part = (name: string) => Number(name.match(/\.(\d+)$/)?.[1] ?? -1);
        return part(a.name) - part(b.name);
      });
    if (authCookies.length === 0) return null;
    const encoded = authCookies.map(({ value }) => value).join("");
    const json = encoded.startsWith("base64-")
      ? Buffer.from(encoded.slice(7), "base64url").toString("utf8")
      : encoded;
    const accessToken = (JSON.parse(json) as { access_token?: string }).access_token;
    return accessToken ? getTokenIdentity(accessToken) : null;
  } catch {
    return null;
  }
}

async function getTokenIdentity(accessToken: string): Promise<{
  role: Role;
  enrollmentStatus: EnrollmentStatus | null;
} | null> {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData } = await sb.auth.getUser(accessToken);
    if (!authData.user) return null;
    const [{ data: profile }, { data: enrollment }] = await Promise.all([
      sb.from("profiles").select("role").eq("id", authData.user.id).maybeSingle(),
      sb.from("enrollments").select("status").eq("user_id", authData.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    return {
      role: (profile?.role as Role) ?? "applicant",
      enrollmentStatus: (enrollment?.status as EnrollmentStatus) ?? null,
    };
  } catch { return null; }
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
