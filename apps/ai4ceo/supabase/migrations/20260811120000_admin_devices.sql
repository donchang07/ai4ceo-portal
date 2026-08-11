-- 관리자 기기 화이트리스트
-- /admin/* 는 세션(로그인)만으로 열리지 않고, 사전에 등록된 기기의 쿠키를 함께 요구한다.
-- 이메일·비밀번호가 유출되어도 등록되지 않은 기기에서는 관리자 화면에 진입할 수 없다.
--
-- 쿠키 원문은 저장하지 않고 sha256 해시만 보관한다 — DB가 유출돼도 기기를 위장할 수 없다.

create table if not exists public.admin_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  label text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz
);

create index if not exists admin_devices_active_idx
  on public.admin_devices (user_id) where revoked_at is null;

alter table public.admin_devices enable row level security;

-- 본인의 기기만 조회·등록·해지할 수 있다 (관리자 여러 명이어도 서로의 기기는 보이지 않는다).
drop policy if exists admin_devices_self on public.admin_devices;
create policy admin_devices_self on public.admin_devices for all
  using (user_id = auth.uid() and is_admin())
  with check (user_id = auth.uid() and is_admin());
