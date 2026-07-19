// Design Ref: PRD 6.7 — RAG retrieval for the AI 조교.
// Embeds the question (OpenAI text-embedding-3-small, same model as scripts/rag-sync.mjs)
// and searches rag_chunks via the match_rag_chunks pgvector function. Server-side only —
// uses the service-role key because rag_* tables have no anon/authenticated policies.

import { createClient } from "@supabase/supabase-js";

export interface RagChunk {
  file_path: string;
  file_name: string;
  chunk_index: number;
  content: string;
  similarity: number;
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function embedQuery(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!res.ok) {
    console.error("[rag] embedding failed", res.status, await res.text().catch(() => ""));
    return null;
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0]?.embedding ?? null;
}

// Best-effort: any failure (missing keys, empty index) returns [] so the tutor
// still answers from the curriculum context.
export async function retrieveRagChunks(question: string, matchCount = 6): Promise<RagChunk[]> {
  try {
    const supabase = getServiceClient();
    if (!supabase) return [];
    const embedding = await embedQuery(question);
    if (!embedding) return [];
    const { data, error } = await supabase.rpc("match_rag_chunks", {
      query_embedding: embedding,
      match_count: matchCount,
    });
    if (error) {
      console.error("[rag] match_rag_chunks failed", error.message);
      return [];
    }
    return (data as RagChunk[]) ?? [];
  } catch (e) {
    console.error("[rag] retrieval error", e);
    return [];
  }
}
