-- 문의 접수(inquiries)
-- 공개 페이지(/contact)에서 로그인 없이 제출하고, 관리자 콘솔(/admin/inquiries)에서 확인·처리한다.
-- 기존 applications 정책과 동일한 형태: public insert + admin 전체 권한.

do $$ begin
  create type inquiry_status as enum ('new','in_progress','done');
exception when duplicate_object then null; end $$;

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  message text not null,
  source text,                     -- 유입 화면 (예: program-self-check)
  status inquiry_status not null default 'new',
  admin_note text,                 -- 관리자 처리 메모
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;

drop policy if exists inquiries_admin on public.inquiries;
create policy inquiries_admin on public.inquiries for all using (is_admin()) with check (is_admin());

drop policy if exists inquiries_insert on public.inquiries;
create policy inquiries_insert on public.inquiries for insert with check (true); -- public contact form
