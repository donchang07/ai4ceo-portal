-- PRD v2.8.3 core (Design Ref: docs/02-design/features/prd-v283-core.design.md §3)
-- F1 /apply/status 공개 조회 함수 · F3 delegated_tasks 위임 할 일

-- ---------- delegated_tasks (US-07) ----------
create table if not exists delegated_tasks (
  id uuid primary key default gen_random_uuid(),
  ceo_user_id uuid not null references profiles(id) on delete cascade,
  assistant_email text not null,
  title text not null,
  note text,
  source_type text not null default 'other'
    check (source_type in ('assignment','material','schedule','other')),
  status text not null default 'pending'
    check (status in ('pending','in_progress','done')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_delegated_tasks_ceo on delegated_tasks (ceo_user_id, created_at desc);
create index if not exists idx_delegated_tasks_assistant on delegated_tasks (lower(assistant_email));

alter table delegated_tasks enable row level security;

-- CEO 본인 · JWT email이 assistant_email과 일치하는 사용자 · admin
create policy dtasks_sel on delegated_tasks for select
  using (
    ceo_user_id = auth.uid()
    or lower(assistant_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or is_admin()
  );

create policy dtasks_ins on delegated_tasks for insert
  with check (ceo_user_id = auth.uid() or is_admin());

create policy dtasks_upd on delegated_tasks for update
  using (
    ceo_user_id = auth.uid()
    or lower(assistant_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or is_admin()
  )
  with check (
    ceo_user_id = auth.uid()
    or lower(assistant_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or is_admin()
  );

create policy dtasks_del on delegated_tasks for delete
  using (ceo_user_id = auth.uid() or is_admin());

-- ---------- 지원 상태 공개 조회 (US-03) ----------
-- applications SELECT는 admin 전용 RLS이므로 security definer로 최소 3필드만 반환.
-- email + phone(숫자만) 완전 일치 시에만 결과를 주어 열거 공격을 차단한다.
create or replace function public.lookup_application_status(p_email text, p_phone text)
returns table (app_status text, cohort_name text, submitted_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select a.status::text, coalesce(c.name, ''), a.created_at
  from applications a
  left join cohorts c on c.id = a.cohort_id
  where lower(a.email) = lower(trim(p_email))
    and regexp_replace(coalesce(a.phone, ''), '\D', '', 'g')
        = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
    and length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 10
  order by a.created_at desc
  limit 3;
$$;

revoke all on function public.lookup_application_status(text, text) from public;
grant execute on function public.lookup_application_status(text, text) to anon, authenticated;
