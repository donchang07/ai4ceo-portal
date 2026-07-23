-- Policy subqueries are still subject to enrollments RLS. Resolve invoice
-- ownership/delegation in a narrow security-definer helper instead.
create or replace function public.can_access_invoice(p_enrollment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.enrollments e
    left join auth.users u on u.id = auth.uid()
    where e.id = p_enrollment_id
      and (
        e.user_id = auth.uid()
        or lower(coalesce(e.billing_delegate_email, '')) = lower(coalesce(u.email, ''))
      )
  );
$$;
revoke all on function public.can_access_invoice(uuid) from public;
grant execute on function public.can_access_invoice(uuid) to authenticated;

drop policy if exists invoices_self on public.invoices;
create policy invoices_self on public.invoices for select
  using (is_admin() or public.can_access_invoice(enrollment_id));
