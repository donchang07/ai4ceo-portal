-- 입금이 확인되면 수강을 곧바로 확정한다.
--
-- 기존에는 결제가 끝나면 enrollments.status 가 'paid' 에서 멈췄고, 관리자가 손으로
-- 'enrolled' 로 올려야만 강의 화면이 열렸다. canAccessLms() 는 'paid' 를 통과시키지 않기
-- 때문에, 그 전환을 놓치면 돈을 낸 수강생이 개강일에 아무것도 못 보는 상태가 된다.
--
-- 결제 확정 경로가 셋(토스 승인 finalize_payment_confirmed · 관리자 수동 confirm_invoice_paid ·
-- 대사 reconcile)이고 모두 각자 'paid' 를 쓰기 때문에, 호출자마다 고치는 대신 테이블에서 강제한다.
--
-- 입금 사실 자체는 invoices.status / paid_at 에 그대로 남으므로 잃는 정보는 없다.

create or replace function public.promote_paid_enrollment()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'paid' then
    new.status := 'enrolled';
  end if;
  return new;
end;
$$;

drop trigger if exists enrollments_promote_paid on public.enrollments;
create trigger enrollments_promote_paid
before insert or update on public.enrollments
for each row execute function public.promote_paid_enrollment();

-- 이미 'paid' 에서 멈춰 있는 수강생 구제 (없으면 아무 일도 하지 않는다).
update public.enrollments set status = 'enrolled' where status = 'paid';
