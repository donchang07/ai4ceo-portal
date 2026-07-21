-- PRD v3.0 화면 구현 — 스키마 정합성 (idempotent / non-destructive)
-- SCR-05 builds 적용추적 · SCR-03 결제위임 · SCR-07 session_catchups · SCR-08 roadmaps
-- 라이브 DB에 직접 적용됐던 변경을 저장소 마이그레이션으로 승계한다.
-- 모든 문장은 IF NOT EXISTS / 정책 존재 가드로 되어 있어 재적용해도 안전(기존 정책 미변경).

-- SCR-05: builds 회사 적용 추적 컬럼
alter table public.builds
  add column if not exists apply_status text not null default 'none'
    check (apply_status in ('none', 'review', 'pilot', 'applied'));
alter table public.builds
  add column if not exists effect_memo text;

-- SCR-03: enrollments 결제 실무 위임 이메일 (위임 변경은 CEO 본인 = enrollment 소유자)
alter table public.enrollments
  add column if not exists billing_delegate_email text;

-- SCR-07: 결석 따라잡기 체크리스트
create table if not exists public.session_catchups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  session_id uuid not null references public.sessions(id),
  watched boolean not null default false,
  materials_done boolean not null default false,
  assignment_done boolean not null default false,
  asked_ai boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz default now()
);
create unique index if not exists session_catchups_user_session_uidx
  on public.session_catchups (user_id, session_id);
alter table public.session_catchups enable row level security;

-- SCR-08: AX 로드맵 (사용자당 1개)
create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id),
  cohort_id uuid references public.cohorts(id),
  status text not null default 'draft' check (status in ('draft', 'final')),
  diagnosis text,
  priorities text,
  plan_90d text,
  expansion text,
  build_ids uuid[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.roadmaps enable row level security;

-- RLS: 본인 self-access. 기존 정책이 이미 있으면 건드리지 않는다(가드).
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'session_catchups'
  ) then
    create policy "session_catchups self access" on public.session_catchups
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'roadmaps'
  ) then
    create policy "roadmaps self access" on public.roadmaps
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
