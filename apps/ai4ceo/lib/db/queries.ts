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
  Inquiry,
  Invoice,
  Material,
  Post,
  Session,
  VideoRec,
  QuestionWithAnswers,
  SessionAnswer,
  ReferralStat,
  NotificationLog,
  OutboxEvent,
  ChatRoomSummary,
  ChatFileRec,
  DriveVideoPolicy,
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

// 문의는 실제 접수만 의미가 있으므로 목업 폴백을 두지 않는다(빈 목록 = 접수 없음).
export async function getInquiries(): Promise<Inquiry[]> {
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb.from("inquiries").select("*").order("created_at", { ascending: false });
    return (data as Inquiry[] | null) ?? [];
  } catch {
    return [];
  }
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

// /trends/[slug] 상세 — body_mdx 포함 단건 조회 (Design Ref: prd-v3-cycle3.design.md §2)
export async function getPost(id: string): Promise<Post | null> {
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb.from("posts").select("*").eq("id", id).maybeSingle();
    if (data) return data as Post;
  } catch {
    /* fall through to mock */
  }
  return MOCK_POSTS.find((p) => p.id === id) ?? null;
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

// /portal/qna 일반 게시판 (D-10) — session_id가 null인 질문(세션에 묶이지 않는 스레드)
export async function getGeneralQuestions(cohortId: string): Promise<QuestionWithAnswers[]> {
  try {
    const sb = await getSupabaseServer();
    const { data: questions } = await sb
      .from("session_questions")
      .select("*")
      .is("session_id", null)
      .eq("cohort_id", cohortId)
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

// ---------- 관리자 운영 화면 (PRD §7.2 /admin/referrals · /admin/notifications · /admin/chat · /admin/drive-policy) ----------
// 운영 로그·현황은 실제 데이터만 의미가 있으므로 목업 폴백을 두지 않는다(빈 목록 = 기록 없음).

export async function getReferralStats(): Promise<ReferralStat[]> {
  try {
    const sb = await getSupabaseServer();
    const [{ data: codes }, { data: apps }] = await Promise.all([
      sb.from("referrals").select("code, label, created_at").order("created_at", { ascending: false }),
      sb.from("applications").select("referral_code, status"),
    ]);
    if (!codes) return [];
    return codes.map((c) => {
      const matched = (apps ?? []).filter((a) => a.referral_code === c.code);
      return {
        code: c.code as string,
        label: (c.label as string | null) ?? null,
        applications: matched.length,
        accepted: matched.filter((a) => a.status === "accepted").length,
        created_at: c.created_at as string,
      };
    });
  } catch {
    return [];
  }
}

export async function getNotificationLogs(limit = 100): Promise<NotificationLog[]> {
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb
      .from("notifications")
      .select("id, channel, template_code, phone, status, sent_at, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as NotificationLog[] | null) ?? [];
  } catch {
    return [];
  }
}

export async function getOutboxEvents(limit = 50): Promise<OutboxEvent[]> {
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb
      .from("notification_outbox")
      .select("id, entity_type, event_type, status, created_at, sent_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as OutboxEvent[] | null) ?? [];
  } catch {
    return [];
  }
}

export async function getChatRoomSummaries(): Promise<ChatRoomSummary[]> {
  try {
    const sb = await getSupabaseServer();
    const { data: rooms } = await sb
      .from("chat_rooms")
      .select("id, title, status, google_drive_folder_url, cohorts(name)")
      .order("created_at", { ascending: false });
    if (!rooms) return [];

    return await Promise.all(
      rooms.map(async (r) => {
        const roomId = r.id as string;
        const [members, messages, files, last] = await Promise.all([
          sb.from("chat_members").select("id", { count: "exact", head: true }).eq("chat_room_id", roomId),
          sb.from("chat_messages").select("id", { count: "exact", head: true }).eq("chat_room_id", roomId),
          sb.from("chat_files").select("id", { count: "exact", head: true }).eq("chat_room_id", roomId),
          sb
            .from("chat_messages")
            .select("created_at")
            .eq("chat_room_id", roomId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        const cohort = r.cohorts as { name: string } | { name: string }[] | null;
        return {
          id: roomId,
          title: (r.title as string | null) ?? null,
          status: (r.status as string) ?? "open",
          cohort_name: Array.isArray(cohort) ? (cohort[0]?.name ?? null) : (cohort?.name ?? null),
          google_drive_folder_url: (r.google_drive_folder_url as string | null) ?? null,
          members: members.count ?? 0,
          messages: messages.count ?? 0,
          files: files.count ?? 0,
          last_message_at: (last.data?.created_at as string | null) ?? null,
        };
      }),
    );
  } catch {
    return [];
  }
}

export async function getChatFiles(limit = 100): Promise<ChatFileRec[]> {
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb
      .from("chat_files")
      .select("id, name, mime_type, size_bytes, permission, google_drive_url, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as ChatFileRec[] | null) ?? [];
  } catch {
    return [];
  }
}

export async function getVideoPolicies(): Promise<DriveVideoPolicy[]> {
  try {
    const sb = await getSupabaseServer();
    const { data } = await sb
      .from("videos")
      .select("id, title, visibility, google_drive_url, published_at")
      .order("published_at", { ascending: false, nullsFirst: false });
    return (data as DriveVideoPolicy[] | null) ?? [];
  } catch {
    return [];
  }
}
