import { getSupabaseServer } from "./supabase-server";
import {
  MOCK_APPLICATIONS,
  MOCK_ASSIGNMENTS,
  MOCK_INVOICES,
  MOCK_MATERIALS,
  MOCK_POSTS,
  MOCK_SESSIONS,
} from "./mock";
import type { Application, Assignment, Invoice, Material, Post, Session } from "./types";

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
      (await sb.from("sessions").select("*").order("week_no", { ascending: true })).data as Session[] | null,
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
