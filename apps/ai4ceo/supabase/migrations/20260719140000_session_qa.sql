-- Session-scoped Q&A (D-10/D-22): student asks, instructor/peers/AI answer.
-- author_name is denormalized at write time because profiles RLS only exposes
-- self/admin — we still need to show other participants' display names.

create table if not exists session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  cohort_id uuid not null references cohorts(id) on delete cascade,
  author_id uuid references profiles(id),
  author_name text,
  body text not null,
  video_position_sec int,          -- optional: "asked at 41:20 of the video"
  created_at timestamptz not null default now()
);

create table if not exists session_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references session_questions(id) on delete cascade,
  author_id uuid references profiles(id),
  author_name text,
  body text not null,
  is_instructor boolean not null default false,
  is_ai boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists session_questions_session_idx on session_questions(session_id, created_at);
create index if not exists session_answers_question_idx on session_answers(question_id, created_at);

alter table session_questions enable row level security;
alter table session_answers enable row level security;

-- read: enrolled cohort members + admin
create policy sq_read on session_questions for select using (is_admin() or is_enrolled(cohort_id));
create policy sq_insert on session_questions for insert with check (
  author_id = auth.uid() and (is_admin() or is_enrolled(cohort_id))
);

create policy sa_read on session_answers for select using (
  is_admin() or exists(
    select 1 from session_questions q where q.id = question_id and is_enrolled(q.cohort_id)
  )
);
create policy sa_insert on session_answers for insert with check (
  author_id = auth.uid() and exists(
    select 1 from session_questions q where q.id = question_id and (is_admin() or is_enrolled(q.cohort_id))
  )
);
