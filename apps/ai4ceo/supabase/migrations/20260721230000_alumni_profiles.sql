-- prd-v3-cycle5 (Design Ref: docs/02-design/features/prd-v3-cycle5.design.md §1)
-- E-6 수료생 선택형 공개 프로필 · E-10 동문 디렉토리.
-- 표시용 이름/직함/회사명은 저장 시점 값을 복제(denormalize) — profiles RLS(본인/admin만)가
-- 타인 조인을 막으므로, 기존 코드 관례(session_questions.author_name 등)와 동일한 패턴.

create table if not exists alumni_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  display_name text,
  job_title text,
  company_name text,
  photo_path text,
  bio text,
  expertise text,
  company_description text,
  homepage_url text,
  contact_interest text,
  contact_email text,
  show_contact boolean not null default false,
  public_message text,
  cohort_label text,
  visibility text not null default 'private' check (visibility in ('private','alumni_only','public')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table alumni_profiles enable row level security;

create or replace function public.is_alumni()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'alumni')
      or exists(select 1 from enrollments where user_id = auth.uid() and status = 'completed');
$$;

revoke all on function public.is_alumni() from public;
grant execute on function public.is_alumni() to authenticated;
revoke execute on function public.is_alumni() from anon;

create policy alumni_profiles_sel on alumni_profiles for select using (
  user_id = auth.uid()
  or is_admin()
  or visibility = 'public'
  or (visibility = 'alumni_only' and is_alumni())
);
create policy alumni_profiles_ins on alumni_profiles for insert
  with check (user_id = auth.uid() or is_admin());
create policy alumni_profiles_upd on alumni_profiles for update
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());
create policy alumni_profiles_del on alumni_profiles for delete
  using (user_id = auth.uid() or is_admin());
