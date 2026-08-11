-- 동문 멤버십 적용 규칙 (DB 강제)
--  1) 멤버십만 단독으로 이용할 수 없다 — 수료 이력이 없으면 'active'가 될 수 없다.
--  2) 유효기간은 수료 시점부터 1년이다.
-- 구매 자체는 막지 않는다. 수료 전 결제는 'pending'(적용 대기)으로 보관되고,
-- 해당 사용자의 수강이 'completed'로 바뀌는 순간 자동으로 활성화된다.
-- 알럼나이 콘텐츠 RLS는 이미 status='active' AND expires_at > now() 를 검사하므로
-- 'pending' 멤버십은 별도 정책 변경 없이 접근에서 제외된다.

alter table public.memberships alter column status set default 'pending';
alter table public.memberships alter column started_at drop default;

comment on column public.memberships.status is
  'pending = 결제 완료·수료 전(적용 대기), active = 수료 후 1년 유효, expired/cancelled = 종료';

-- 해당 사용자의 가장 최근 수료 시각. 수료 이력이 없으면 null.
create or replace function public.latest_completion_at(p_user uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select max(coalesce(e.completed_at, now()))
  from public.enrollments e
  where e.user_id = p_user
    and e.status = 'completed';
$$;

-- 멤버십 행이 저장될 때 수료 이력을 기준으로 상태·기간을 정규화한다.
create or replace function public.sync_membership_activation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_completed timestamptz;
begin
  v_completed := public.latest_completion_at(new.user_id);

  if v_completed is null then
    -- 수료 이력 없음 → 어떤 경로로 들어와도 적용하지 않는다.
    if new.status = 'active' then
      new.status := 'pending';
      new.started_at := null;
      new.expires_at := null;
    end if;
  elsif new.status = 'pending' then
    -- 이미 수료한 사용자의 구매 → 즉시 활성화 (수료 시점 기준 1년)
    new.status := 'active';
    new.started_at := v_completed;
    new.expires_at := v_completed + interval '1 year';
  elsif new.status = 'active' and new.expires_at is null then
    new.started_at := coalesce(new.started_at, v_completed);
    new.expires_at := coalesce(new.started_at, v_completed) + interval '1 year';
  end if;

  return new;
end;
$$;

drop trigger if exists memberships_activation on public.memberships;
create trigger memberships_activation
before insert or update on public.memberships
for each row execute function public.sync_membership_activation();

-- 수강이 수료로 바뀌면 적용 대기 중인 멤버십을 그 시점부터 1년으로 활성화한다.
create or replace function public.activate_memberships_on_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_completed timestamptz;
begin
  if new.status = 'completed' then
    v_completed := coalesce(new.completed_at, now());
    update public.memberships m
       set status = 'active',
           started_at = v_completed,
           expires_at = v_completed + interval '1 year'
     where m.user_id = new.user_id
       and m.status = 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists enrollments_membership_activation on public.enrollments;
create trigger enrollments_membership_activation
after insert or update of status, completed_at on public.enrollments
for each row execute function public.activate_memberships_on_completion();
