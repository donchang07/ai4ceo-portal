-- Regression fixes from the 2026-07-23 Playwright staging run.
-- Scope: ACC-007, BILL-005/006/012, LMS-009, ARCH-004, SEC-010, ADM-010.

-- Assistant-to-student links are the source of truth for delegated access.
create table if not exists public.assistant_links (
  id uuid primary key default gen_random_uuid(),
  assistant_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (assistant_id, student_id, cohort_id)
);
alter table public.assistant_links enable row level security;
drop policy if exists assistant_links_read on public.assistant_links;
create policy assistant_links_read on public.assistant_links for select
  using (is_admin() or assistant_id = auth.uid() or student_id = auth.uid());
drop policy if exists assistant_links_admin on public.assistant_links;
create policy assistant_links_admin on public.assistant_links for all
  using (is_admin()) with check (is_admin());

-- A matching email alone is not authorization for delegated tasks.
drop policy if exists dtasks_sel on public.delegated_tasks;
drop policy if exists dtasks_upd on public.delegated_tasks;
create policy dtasks_sel on public.delegated_tasks for select using (
  ceo_user_id = auth.uid()
  or is_admin()
  or exists (
    select 1 from public.assistant_links l
    where l.assistant_id = auth.uid() and l.student_id = delegated_tasks.ceo_user_id
  )
);
create policy dtasks_upd on public.delegated_tasks for update using (
  ceo_user_id = auth.uid()
  or is_admin()
  or exists (
    select 1 from public.assistant_links l
    where l.assistant_id = auth.uid() and l.student_id = delegated_tasks.ceo_user_id
  )
) with check (
  ceo_user_id = auth.uid()
  or is_admin()
  or exists (
    select 1 from public.assistant_links l
    where l.assistant_id = auth.uid() and l.student_id = delegated_tasks.ceo_user_id
  )
);

-- Materials are for current learners only. Alumni video access remains separate.
drop policy if exists materials_read on public.materials;
create policy materials_read on public.materials for select using (
  is_admin()
  or exists (
    select 1
    from public.sessions s
    join public.enrollments e on e.cohort_id = s.cohort_id
    where s.id = materials.session_id
      and e.user_id = auth.uid()
      and e.status in ('enrolled', 'in_training')
  )
);

-- Alumni-only posts require an active, unexpired membership.
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select using (
  audience = 'public'
  or is_admin()
  or (audience = 'student' and exists (
    select 1 from public.enrollments e
    where e.user_id = auth.uid() and e.status in ('enrolled', 'in_training')
  ))
  or (audience = 'alumni' and exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.status = 'active'
      and (m.expires_at is null or m.expires_at > now())
  ))
);

-- Durable, idempotent notification outbox for billing events.
create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (entity_type, entity_id, event_type)
);
alter table public.notification_outbox enable row level security;
drop policy if exists notification_outbox_admin on public.notification_outbox;
create policy notification_outbox_admin on public.notification_outbox for all
  using (is_admin()) with check (is_admin());

create or replace function public.enqueue_paid_invoice()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_user_id uuid;
begin
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    select e.user_id into v_user_id from public.enrollments e where e.id = new.enrollment_id;
    insert into public.notification_outbox (
      entity_type, entity_id, event_type, recipient_user_id, payload
    ) values (
      'invoice', new.id, 'invoice.paid', v_user_id,
      jsonb_build_object('invoice_id', new.id, 'amount', new.amount)
    ) on conflict (entity_type, entity_id, event_type) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists invoices_enqueue_paid on public.invoices;
create trigger invoices_enqueue_paid
after insert or update of status on public.invoices
for each row execute function public.enqueue_paid_invoice();

-- Delegated billing read: the authenticated email must match the owner's explicit delegate.
drop policy if exists invoices_self on public.invoices;
create policy invoices_self on public.invoices for select using (
  is_admin()
  or exists (
    select 1 from public.enrollments e
    where e.id = invoices.enrollment_id
      and (
        e.user_id = auth.uid()
        or lower(coalesce(e.billing_delegate_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

-- A single invoice has a single tax-invoice request. This also makes retries idempotent.
create unique index if not exists tax_invoices_invoice_id_uidx
  on public.tax_invoices (invoice_id);

create or replace function public.request_tax_invoice(p_invoice_id uuid, p_biz_reg_no text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_delegate text;
  v_status text;
begin
  select e.user_id, e.billing_delegate_email into v_owner, v_delegate
  from public.invoices i join public.enrollments e on e.id = i.enrollment_id
  where i.id = p_invoice_id;
  if v_owner is null then raise exception 'invoice not found'; end if;
  if v_owner <> auth.uid()
     and not is_admin()
     and lower(coalesce(v_delegate, '')) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'not authorized';
  end if;
  update public.invoices set biz_reg_no = nullif(trim(coalesce(p_biz_reg_no, '')), '') where id = p_invoice_id;
  insert into public.tax_invoices (invoice_id) values (p_invoice_id)
    on conflict (invoice_id) do update set invoice_id = excluded.invoice_id
    returning status::text into v_status;
  return v_status;
end;
$$;
revoke all on function public.request_tax_invoice(uuid, text) from public;
grant execute on function public.request_tax_invoice(uuid, text) to authenticated;

-- Admin-only, idempotent payment confirmation used by the admin UI.
create or replace function public.confirm_invoice_paid(p_invoice_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_enrollment_id uuid;
begin
  if not is_admin() then raise exception 'not authorized'; end if;
  update public.invoices
    set status = 'paid', paid_at = coalesce(paid_at, now())
    where id = p_invoice_id
    returning enrollment_id into v_enrollment_id;
  if v_enrollment_id is null then raise exception 'invoice not found'; end if;
  update public.enrollments set status = 'paid' where id = v_enrollment_id;
end;
$$;
revoke all on function public.confirm_invoice_paid(uuid) from public;
grant execute on function public.confirm_invoice_paid(uuid) to authenticated;
