-- Adds a manual drag-reorder column for sessions (admin curriculum editor).
alter table sessions add column if not exists sort_order int;

update sessions
set sort_order = ranked.rn - 1
from (
  select id, row_number() over (order by week_no asc nulls last, starts_at asc) as rn
  from sessions
) ranked
where sessions.id = ranked.id and sessions.sort_order is null;
