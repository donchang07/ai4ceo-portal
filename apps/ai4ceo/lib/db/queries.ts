import { getSupabaseServer } from "./supabase-server";
import {
  MOCK_APPLICATIONS,
  MOCK_ASSIGNMENTS,
  MOCK_INVOICES,
  MOCK_MATERIALS,
  MOCK_POSTS,
  MOCK_SESSIONS,
} from "./mock";
import type {
  Application,
  Assignment,
  Invoice,
  Material,
  Post,
  Session,
  VideoRec,
  QuestionWithAnswers,
  SessionAnswer,
} from "./types";

// Each query attempts Supabase (RLS enforced). When the schema is not yet
// applied or returns nothing, it falls back to representative 18기 data so the
// UI is fully demonstrable. Real data always takes precedence.

async function tryQuery<T>(fn: (sb: Awaited<ReturnType<typeof getSupabaseServer>>) => Promise<T[] | null>, fallback: T[]): Promise<T[]> {
  try {
    const sb = await getSupabaseServer();
    const rows = await fn(sb);
    if (rows && rows.length > 0) return rows;
  } catch {
    /* fall through */
  }
  return fallback;
}

export async function getSessions(): Promise<Session[]> {
  return tryQuery(
    async (sb) =>
      (
        await sb
          .from("sessions")
          .select("*")
          .order("sort_order", { ascending: true, nullsFirst: false })
          .order("week_no", { ascending: true })
      ).data as Session[] | null,
    MOCK_SESSIONS,
  );
}

export async function getSession(id: string): Promise<Session | null> {
  const all = await getSessions();
  return all.find((s) => s.id === id) ?? all[0] ?? null;
}

export async function getMaterials(sessionId: string): Promise<Material[]> {
  const rows = await tryQuery(
    async (sb) => (await sb.from("materials").select("*").eq("session_id", sessionId)).data as Material[] | null,
    MOCK_MATERIALS,
  );
  return rows.filter((m) => m.session_id === sessionId || MOCK_MATERIALS.includes(m));
}

export async function getAssignments(): Promise<Assignment[]> {
  return tryQuery(
    async (sb) => (await sb.from("assignments").select("*").order("due_at")).data as Assignment[] | null,
    MOCK_ASSIGNMENTS,
  );
}

export async function getApplications(): Promise<Application[]> {
  return tryQuery(
    async (sb) => (await sb.from("applications").select("*").order("created_at", { ascending: false })).data as Application[] | null,
    MOCK_APPLICATIONS,
  );
}

export async function getInvoices(): Promise<Invoice[]> {
  return tryQuery(
    async (sb) => (await sb.from("invoices").select("*").order("created_at", { ascending: false })).data as Invoice[] | null,
    MOCK_INVOICES,
  );
}

export async function getPosts(): Promise<Post[]> {
  return tryQuery(
    async (sb) => (await sb.from("posts").select("*").order("published_at", { ascending: false })).data as Post[] | null,
    MOCK_POSTS,
  );
}

export async function getSessionVideo(sessionId: string): Promise<VideoRec | null> {
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb
      .from("videos")
      .select("*")
      .eq("session_id", sessionId)
      .eq("visibility", "cohort_readonly")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as VideoRec) ?? null;
  } catch {
    return null;
  }
}

// Session Q&A (D-10/D-22) — real questions + threaded answers.
export async function getSessionQuestions(sessionId: string): Promise<QuestionWithAnswers[]> {
  try {
    const sb = await getSupabaseServer();
    const { data: questions } = await sb
      .from("session_questions")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });
    if (!questions || questions.length === 0) return [];

    const ids = questions.map((q) => q.id as string);
    const { data: answers } = await sb
      .from("session_answers")
      .select("*")
      .in("question_id", ids)
      .order("created_at", { ascending: true });

    const byQuestion = new Map<string, SessionAnswer[]>();
    for (const a of (answers as SessionAnswer[]) ?? []) {
      const arr = byQuestion.get(a.question_id) ?? [];
      arr.push(a);
      byQuestion.set(a.question_id, arr);
    }
    return (questions as QuestionWithAnswers[]).map((q) => ({ ...q, answers: byQuestion.get(q.id) ?? [] }));
  } catch {
    return [];
  }
}
