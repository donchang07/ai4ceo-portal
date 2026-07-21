-- PRD v3.0 remaining screens (Design Ref: docs/02-design/features/prd-v30-remaining.design.md §3)
-- F1 /program Build 미리보기 · F2 billing 위임 · F3 builds 적용 추적
-- F4 session_catchups · F5 roadmaps · F6 alumni archive RLS 확장

-- ---------- (a) builds: 적용 추적 (SCR-05, US-06) ----------
alter table builds add column if not exists apply_status text not null default 'none';
alter table builds drop constraint if exists builds_apply_status_check;
alter table builds add constraint builds_apply_status_check
  check (apply_status in ('none','review','pilot','applied'));
alter table builds add column if not exists effect_memo text;

create index if not exists idx_builds_public on builds (created_at desc) where visibility = 'public';

-- ---------- (b) 결제 실무 위임 (SCR-03, US-04) ----------
alter table enrollments add column if not exists billing_delegate_email text;

-- enrollments UPDATE는 admin 전용이므로(학생이 status 등을 조작하면 안 됨),
-- 위임 이메일 한 컬럼만 본인 enrollment에 한해 갱신하는 security definer 함수로 연다.
create or replace function public.set_billing_delegate(p_enrollment_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_email is not null and p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'invalid email';
  end if;
  update enrollments
     set billing_delegate_email = p_email
   where id = p_enrollment_id
     and user_id = auth.uid();
  if not found then
    raise exception 'enrollment not found or not owned';
  end if;
end;
$$;

revoke all on function public.set_billing_delegate(uuid, text) from public;
grant execute on function public.set_billing_delegate(uuid, text) to authenticated;

-- invoices: 본인 + 위임된 assistant(JWT email 일치) + admin
drop policy if exists invoices_self on invoices;
create policy invoices_self on invoices for select using (
  is_admin()
  or exists(
    select 1 from enrollments e
    where e.id = enrollment_id
      and (
        e.user_id = auth.uid()
        or lower(coalesce(e.billing_delegate_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

drop policy if exists taxinv_self on tax_invoices;
create policy taxinv_self on tax_invoices for select using (
  is_admin()
  or exists(
    select 1 from invoices i
    join enrollments e on e.id = i.enrollment_id
    where i.id = invoice_id
      and (
        e.user_id = auth.uid()
        or lower(coalesce(e.billing_delegate_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

-- ---------- (c) session_catchups: 결석 따라잡기 (SCR-07, US-08) ----------
create table if not exists session_catchups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  watched boolean not null default false,
  materials_done boolean not null default false,
  assignment_done boolean not null default false,
  asked_ai boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique (user_id, session_id)
);

alter table session_catchups enable row level security;

create policy catchups_sel on session_catchups for select
  using (user_id = auth.uid() or is_admin());
create policy catchups_ins on session_catchups for insert
  with check (user_id = auth.uid() or is_admin());
create policy catchups_upd on session_catchups for update
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());
create policy catchups_del on session_catchups for delete
  using (is_admin());

-- ---------- (d) roadmaps: AX 로드맵 (SCR-08, US-09) ----------
create table if not exists roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  cohort_id uuid references cohorts(id),
  status text not null default 'draft' check (status in ('draft','final')),
  diagnosis text,
  priorities text,
  plan_90d text,
  expansion text,
  build_ids uuid[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

alter table roadmaps enable row level security;

create policy roadmaps_sel on roadmaps for select
  using (user_id = auth.uid() or is_admin());
create policy roadmaps_ins on roadmaps for insert
  with check (user_id = auth.uid() or is_admin());
create policy roadmaps_upd on roadmaps for update
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());
create policy roadmaps_del on roadmaps for delete
  using (is_admin());

-- ---------- (e) 동문 아카이브 read 확장 (SCR-09, US-10) ----------
-- v2.4 확정: 멤버십 active 동문은 과거 전 기수 녹화본·교재를 read-only 열람
create or replace function public.has_active_membership()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(
    select 1 from memberships m
    where m.user_id = auth.uid()
      and m.status = 'active'
      and (m.expires_at is null or m.expires_at > now())
  );
$$;

revoke all on function public.has_active_membership() from public;
grant execute on function public.has_active_membership() to authenticated;

drop policy if exists sessions_read on sessions;
create policy sessions_read on sessions for select using (
  is_admin()
  or is_enrolled(cohort_id)
  or is_published
);

drop policy if exists videos_read on videos;
create policy videos_read on videos for select using (
  is_admin()
  or exists(
    select 1 from sessions s
    where s.id = session_id
      and (
        is_enrolled(s.cohort_id)
        or (s.is_published and has_active_membership())
      )
  )
);

drop policy if exists materials_read on materials;
create policy materials_read on materials for select using (
  is_admin()
  or exists(
    select 1 from sessions s
    where s.id = session_id
      and (
        is_enrolled(s.cohort_id)
        or (s.is_published and has_active_membership())
      )
  )
);

-- 신규 security definer 함수 2개는 로그인 사용자 전용 — anon 실행 명시 차단
revoke execute on function public.has_active_membership() from anon;
revoke execute on function public.set_billing_delegate(uuid, text) from anon;
