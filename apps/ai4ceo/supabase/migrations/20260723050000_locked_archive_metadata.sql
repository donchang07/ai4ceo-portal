-- Expired alumni may browse a locked archive index without receiving content
-- bodies or actionable resource URLs. Direct posts access remains RLS-protected.
create or replace function public.list_locked_archive_metadata()
returns table (
  id uuid,
  title text,
  cohort_id uuid,
  category text,
  tags text[],
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.title,
    p.cohort_id,
    p.category,
    p.tags,
    p.published_at
  from public.posts p
  where auth.uid() is not null
    and p.audience = 'alumni'
    and p.board in ('brief', 'ai_trend')
    and p.published_at is not null
    and p.published_at <= now()
    and (
      exists (
        select 1
        from public.profiles pr
        where pr.id = auth.uid()
          and pr.role = 'alumni'
      )
      or exists (
        select 1
        from public.enrollments e
        where e.user_id = auth.uid()
          and e.status = 'completed'
      )
    )
    and not exists (
      select 1
      from public.memberships m
      where m.user_id = auth.uid()
        and m.status = 'active'
        and (m.expires_at is null or m.expires_at > now())
    )
  order by p.published_at desc;
$$;

revoke all on function public.list_locked_archive_metadata() from public;
revoke all on function public.list_locked_archive_metadata() from anon;
grant execute on function public.list_locked_archive_metadata() to authenticated;

-- Treat an active membership with a past expiry as inactive everywhere the
-- server resolves the current user's access context.
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
        and (m.expires_at is null or m.expires_at > now())
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
