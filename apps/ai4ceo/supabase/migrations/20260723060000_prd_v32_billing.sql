-- PRD v3.2 / v3.1 — Billing 정합화
-- Design Ref: docs/02-design/features/prd-v32-billing.design.md
-- payments 확장 + payment_events append-only 원장 + 결제 RPC(prepare/confirm/fail/수동확인/대사).
-- 절대규칙: R4(서버 금액대조) · R5(orderId 멱등) — RPC 내부에서 강제.

-- ── 1. Enums ──────────────────────────────────────────────────────────
do $$ begin
  create type payment_event_type as enum ('requested','approved','failed','reconciled','canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_event_source as enum ('server','reconciler','webhook','admin');
exception when duplicate_object then null; end $$;

-- ── 2. payments 확장 컬럼 (PRD §6.3) ─────────────────────────────────
alter table public.payments add column if not exists order_id text;
alter table public.payments add column if not exists idempotency_key text;
alter table public.payments add column if not exists consent jsonb;
alter table public.payments add column if not exists consent_at timestamptz;
alter table public.payments add column if not exists requested_at timestamptz;
alter table public.payments add column if not exists finalized_at timestamptz;
alter table public.payments add column if not exists fail_code text;
alter table public.payments add column if not exists fail_message text;
alter table public.payments add column if not exists confirmed_by uuid references public.profiles(id) on delete set null;
alter table public.payments add column if not exists confirmed_at timestamptz;
alter table public.payments add column if not exists match_ref text;
alter table public.payments add column if not exists raw_confirm jsonb;

create unique index if not exists payments_order_id_uidx on public.payments(order_id) where order_id is not null;

-- ── 3. payment_events (append-only 원장, C-11) ───────────────────────
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id text,
  payment_key text,
  event_type payment_event_type not null,
  amount int,
  raw jsonb,
  source payment_event_source not null default 'server',
  created_at timestamptz not null default now()
);
create index if not exists payment_events_order_id_idx on public.payment_events(order_id);
alter table public.payment_events enable row level security;
drop policy if exists payment_events_admin on public.payment_events;
create policy payment_events_admin on public.payment_events for select using (is_admin());

-- append-only: update/delete 차단
create or replace function public.payment_events_append_only()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'payment_events is append-only (no update/delete)';
end;
$$;
drop trigger if exists payment_events_no_mutate on public.payment_events;
create trigger payment_events_no_mutate
before update or delete on public.payment_events
for each row execute function public.payment_events_append_only();

-- ── 4. 소유권 헬퍼: order_id / invoice가 호출자 소유인지 ───────────────
create or replace function public.invoice_belongs_to_caller(p_invoice_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.invoices i
    join public.enrollments e on e.id = i.enrollment_id
    where i.id = p_invoice_id
      and (
        e.user_id = auth.uid()
        or lower(coalesce(e.billing_delegate_email,'')) = lower(coalesce(auth.jwt() ->> 'email',''))
      )
  ) or is_admin();
$$;

-- ── 5. record_payment_requested — 결제 시작(2단계 영속화 R1) ──────────
create or replace function public.record_payment_requested(
  p_invoice_id uuid,
  p_provider payment_method,
  p_order_id text,
  p_amount int,
  p_consent jsonb default '{}'::jsonb
)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_invoice_amount int;
  v_existing text;
begin
  if not public.invoice_belongs_to_caller(p_invoice_id) then
    raise exception 'not authorized';
  end if;

  -- R5: orderId 멱등 — 이미 있으면 기존 order_id 반환
  select order_id into v_existing from public.payments where order_id = p_order_id;
  if v_existing is not null then
    return v_existing;
  end if;

  -- R4: 금액은 서버(invoice) 기준으로만 저장. 프론트 amount 는 신뢰하지 않는다.
  select amount into v_invoice_amount from public.invoices where id = p_invoice_id;
  if v_invoice_amount is null then
    raise exception 'invoice not found';
  end if;
  if p_amount is not null and p_amount <> v_invoice_amount then
    raise exception 'amount mismatch: request % vs invoice %', p_amount, v_invoice_amount;
  end if;

  insert into public.payments (
    invoice_id, provider, order_id, amount, status, requested_at, consent, consent_at
  ) values (
    p_invoice_id, p_provider, p_order_id, v_invoice_amount, 'pending', now(),
    coalesce(p_consent,'{}'::jsonb), case when p_consent is not null then now() else null end
  );

  insert into public.payment_events (order_id, event_type, amount, source, raw)
  values (p_order_id, 'requested', v_invoice_amount, 'server', coalesce(p_consent,'{}'::jsonb));

  return p_order_id;
end;
$$;
revoke all on function public.record_payment_requested(uuid, payment_method, text, int, jsonb) from public;
grant execute on function public.record_payment_requested(uuid, payment_method, text, int, jsonb) to authenticated;

-- ── 5b. payment_lookup — confirm 전 서버 금액대조용(R4) ──────────────
create or replace function public.payment_lookup(p_order_id text)
returns table (invoice_id uuid, amount int, status payment_status)
language sql stable security definer set search_path = public as $$
  select p.invoice_id, p.amount, p.status
  from public.payments p
  where p.order_id = p_order_id
    and public.invoice_belongs_to_caller(p.invoice_id);
$$;
revoke all on function public.payment_lookup(text) from public;
grant execute on function public.payment_lookup(text) to authenticated;

-- ── 6. finalize_payment_confirmed — 승인 종료(R2) ────────────────────
create or replace function public.finalize_payment_confirmed(
  p_order_id text,
  p_payment_key text,
  p_amount int,
  p_raw jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_invoice_id uuid;
  v_amount int;
  v_status payment_status;
begin
  select invoice_id, amount, status into v_invoice_id, v_amount, v_status
  from public.payments where order_id = p_order_id;
  if v_invoice_id is null then
    raise exception 'payment not found for order %', p_order_id;
  end if;
  if not public.invoice_belongs_to_caller(v_invoice_id) then
    raise exception 'not authorized';
  end if;

  -- 멱등: 이미 approved면 아무것도 하지 않는다.
  if v_status = 'approved' then
    return;
  end if;

  -- R4: 서버 금액 대조 — 불일치 시 승인 금지.
  if p_amount is not null and p_amount <> v_amount then
    raise exception 'amount mismatch: confirm % vs recorded %', p_amount, v_amount;
  end if;

  update public.payments set
    status = 'approved',
    provider_payment_key = p_payment_key,
    approved_at = now(),
    finalized_at = now(),
    raw_confirm = coalesce(p_raw,'{}'::jsonb)
  where order_id = p_order_id;

  insert into public.payment_events (order_id, payment_key, event_type, amount, source, raw)
  values (p_order_id, p_payment_key, 'approved', v_amount, 'server', coalesce(p_raw,'{}'::jsonb));

  -- invoices.paid → enrollments.paid (invoices 트리거가 outbox 발행)
  update public.invoices set status = 'paid', paid_at = coalesce(paid_at, now())
  where id = v_invoice_id;
  update public.enrollments set status = 'paid'
  where id = (select enrollment_id from public.invoices where id = v_invoice_id)
    and status in ('invited','invoiced');
end;
$$;
revoke all on function public.finalize_payment_confirmed(text, text, int, jsonb) from public;
grant execute on function public.finalize_payment_confirmed(text, text, int, jsonb) to authenticated;

-- ── 7. fail_payment — 실패/취소 종료 ────────────────────────────────
create or replace function public.fail_payment(
  p_order_id text,
  p_fail_code text,
  p_fail_message text,
  p_raw jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_invoice_id uuid;
  v_amount int;
  v_status payment_status;
begin
  select invoice_id, amount, status into v_invoice_id, v_amount, v_status
  from public.payments where order_id = p_order_id;
  if v_invoice_id is null then
    raise exception 'payment not found for order %', p_order_id;
  end if;
  if not public.invoice_belongs_to_caller(v_invoice_id) then
    raise exception 'not authorized';
  end if;
  if v_status = 'approved' then
    return; -- 이미 승인된 건은 실패로 덮지 않는다.
  end if;

  update public.payments set
    status = 'failed', fail_code = p_fail_code, fail_message = p_fail_message, finalized_at = now()
  where order_id = p_order_id;

  insert into public.payment_events (order_id, event_type, amount, source, raw)
  values (p_order_id, 'failed', v_amount, 'server',
          jsonb_build_object('code', p_fail_code, 'message', p_fail_message) || coalesce(p_raw,'{}'::jsonb));
end;
$$;
revoke all on function public.fail_payment(text, text, text, jsonb) from public;
grant execute on function public.fail_payment(text, text, text, jsonb) to authenticated;

-- ── 8. confirm_invoice_paid — 운영자 수동 입금확인(은행입금·스마트스토어) ──
-- 하위호환(1-arg) 유지 + match_ref 오버로드. payments+payment_events(admin) 기록 후 paid 전환.
create or replace function public.confirm_invoice_paid(p_invoice_id uuid, p_match_ref text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_enrollment_id uuid;
  v_amount int;
  v_method payment_method;
  v_status invoice_status;
  v_order text;
begin
  if not is_admin() then raise exception 'not authorized'; end if;

  select enrollment_id, amount, method, status
    into v_enrollment_id, v_amount, v_method, v_status
    from public.invoices where id = p_invoice_id;
  if v_enrollment_id is null then raise exception 'invoice not found'; end if;

  -- 멱등: 이미 paid면 결제 레코드를 중복 생성하지 않는다(BILL-006).
  if v_status <> 'paid' then
    v_order := 'MANUAL-' || replace(p_invoice_id::text, '-', '');
    insert into public.payments (
      invoice_id, provider, order_id, amount, status,
      match_ref, confirmed_by, confirmed_at, finalized_at, approved_at
    ) values (
      p_invoice_id, v_method, v_order, v_amount, 'approved',
      nullif(trim(coalesce(p_match_ref,'')),''), auth.uid(), now(), now(), now()
    ) on conflict (order_id) where order_id is not null do nothing;

    insert into public.payment_events (order_id, event_type, amount, source, raw)
    values (v_order, 'approved', v_amount, 'admin',
            jsonb_build_object('match_ref', p_match_ref, 'provider', v_method));
  end if;

  update public.invoices set status = 'paid', paid_at = coalesce(paid_at, now())
    where id = p_invoice_id;
  update public.enrollments set status = 'paid' where id = v_enrollment_id;
end;
$$;
revoke all on function public.confirm_invoice_paid(uuid, text) from public;
grant execute on function public.confirm_invoice_paid(uuid, text) to authenticated;

-- 1-arg 래퍼(기존 호출부 호환)
create or replace function public.confirm_invoice_paid(p_invoice_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.confirm_invoice_paid(p_invoice_id, null);
end;
$$;
revoke all on function public.confirm_invoice_paid(uuid) from public;
grant execute on function public.confirm_invoice_paid(uuid) to authenticated;

-- ── 9. reconcile_billing — 결제 대사 리포트(C-11) ────────────────────
create or replace function public.reconcile_billing()
returns table (
  kind text,          -- unpaid | amount_mismatch | orphan_pending
  invoice_id uuid,
  order_id text,
  biz_name text,
  invoice_amount int,
  paid_amount int,
  detail text
) language sql stable security definer set search_path = public as $$
  -- (a) 미입금: issued 인데 승인 결제 없음
  select 'unpaid', i.id, null::text, i.biz_name, i.amount, null::int,
         '발행 후 승인된 결제 없음'
  from public.invoices i
  where i.status = 'issued'
    and not exists (select 1 from public.payments p where p.invoice_id = i.id and p.status = 'approved')
    and is_admin()
  union all
  -- (b) 금액 불일치: 승인 금액 ≠ invoice 금액 (부분/초과)
  select 'amount_mismatch', i.id, p.order_id, i.biz_name, i.amount, p.amount,
         case when p.amount < i.amount then '부분입금' else '초과입금' end
  from public.invoices i
  join public.payments p on p.invoice_id = i.id and p.status = 'approved'
  where p.amount is distinct from i.amount and is_admin()
  union all
  -- (c) 고아 pending: requested 후 15분 경과했는데 미완결
  select 'orphan_pending', i.id, p.order_id, i.biz_name, i.amount, p.amount,
         '15분 경과 미완결(대사 필요)'
  from public.payments p
  join public.invoices i on i.id = p.invoice_id
  where p.status = 'pending'
    and p.requested_at is not null
    and p.requested_at < now() - interval '15 minutes'
    and is_admin();
$$;
revoke all on function public.reconcile_billing() from public;
grant execute on function public.reconcile_billing() to authenticated;
