create or replace function public.current_user_context()
returns table (
  name text,
  role text,
  enrollment_status text,
  cohort_id uuid,
  has_active_membership boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.name::text,
    p.role::text,
    e.status::text,
    e.cohort_id,
    exists (
      select 1
      from public.memberships m
      where m.user_id = auth.uid()
        and m.status = 'active'
    )
  from public.profiles p
  left join lateral (
    select en.status, en.cohort_id
    from public.enrollments en
    where en.user_id = auth.uid()
    order by en.created_at desc
    limit 1
  ) e on true
  where p.id = auth.uid();
$$;

grant execute on function public.current_user_context() to authenticated;
