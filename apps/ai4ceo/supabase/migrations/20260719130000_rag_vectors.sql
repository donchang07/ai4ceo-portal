-- RAG vector store for AI 조교 (D-19/D-25).
-- Source: CEO18기 강의자료 디렉토리 — synced by scripts/rag-sync.mjs (hash-based incremental).
create extension if not exists vector;

create table if not exists rag_files (
  path text primary key,            -- source-relative file path
  name text not null,
  hash text not null,               -- sha256 of file bytes
  mtime timestamptz,
  chunk_count int not null default 0,
  synced_at timestamptz not null default now()
);

create table if not exists rag_chunks (
  id uuid primary key default gen_random_uuid(),
  file_path text not null references rag_files(path) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1536)            -- OpenAI text-embedding-3-small
);

create index if not exists rag_chunks_embedding_idx
  on rag_chunks using hnsw (embedding vector_cosine_ops);

alter table rag_files enable row level security;
alter table rag_chunks enable row level security;
-- no policies: only the service-role key (sync script + server-side retrieval) touches these

create or replace function public.match_rag_chunks(
  query_embedding vector(1536),
  match_count int default 6
)
returns table (file_path text, file_name text, chunk_index int, content text, similarity float)
language sql stable security definer set search_path = public as $$
  select c.file_path, f.name, c.chunk_index, c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from rag_chunks c
  join rag_files f on f.path = c.file_path
  where c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- security definer function must not be callable by anon/authenticated directly
revoke execute on function public.match_rag_chunks(vector, int) from anon, authenticated, public;
