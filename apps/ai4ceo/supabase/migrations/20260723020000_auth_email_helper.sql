-- Resolve the signed-in user's email from auth.users rather than depending on
-- a particular JWT claim layout. Used only for explicit billing delegation.
create or replace function public.current_auth_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select lower(coalesce(u.email, '')) from auth.users u where u.id = auth.uid();
$$;
revoke all on function public.current_auth_email() from public;
grant execute on function public.current_auth_email() to authenticated;

drop policy if exists invoices_self on public.invoices;
create policy invoices_self on public.invoices for select using (
  is_admin()
  or exists (
    select 1 from public.enrollments e
    where e.id = invoices.enrollment_id
      and (
        e.user_id = auth.uid()
        or lower(coalesce(e.billing_delegate_email, '')) = public.current_auth_email()
      )
  )
);

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
     and lower(coalesce(v_delegate, '')) <> public.current_auth_email() then
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
