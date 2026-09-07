-- 최초 관리자 온보딩을 DB에서 강제한다.
--
-- lib/db/auth.ts 의 ADMIN_EMAIL 폴백은 실제로 발동하지 않는다 — /api/auth/finalize 가
-- profiles 행을 role='applicant'(스키마 기본값)로 먼저 만들기 때문에 `?? ` 분기에 닿지 않는다.
-- 게다가 /admin 게이트(app/admin/layout.tsx)는 이메일을 보지 않고 profiles.role 만 본다.
-- 그래서 20260719090100_seed.sql 의 일회성 update 를 상시 규칙으로 승격한다.
--
-- 이메일은 lib/core/constants.ts 의 ADMIN_EMAIL 과 같은 값이어야 한다. SQL이 TS 상수를 읽을 수
-- 없어 중복되지만, seed 마이그레이션도 같은 방식으로 하드코딩돼 있다.

create or replace function public.bootstrap_admin_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if exists (
    select 1 from auth.users u
    where u.id = new.id
      and lower(u.email) = 'donchang0725@gmail.com'
  ) then
    new.role := 'admin';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_bootstrap_admin on public.profiles;
create trigger profiles_bootstrap_admin
before insert on public.profiles
for each row execute function public.bootstrap_admin_profile();

-- 이미 가입한 뒤라면 지금 승격한다 (재실행 안전).
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and lower(u.email) = 'donchang0725@gmail.com'
  and p.role <> 'admin';
