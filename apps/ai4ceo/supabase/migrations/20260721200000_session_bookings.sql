-- prd-v3-m2-booking (Design Ref: docs/02-design/features/prd-v3-m2-booking.design.md §1)
-- D-12 1:1 코칭 예약 · D-13 오프라인 보충수업 신청 — 공용 예약 레이어.
-- sessions.type('coaching'/'offline_supplement')은 이미 스키마에 존재, 슬롯 테이블 신설 없음.

create table if not exists session_bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'booked' check (status in ('booked','cancelled')),
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (session_id, user_id)
);

create index if not exists idx_session_bookings_session on session_bookings (session_id);

alter table session_bookings enable row level security;

create policy bookings_sel on session_bookings for select
  using (user_id = auth.uid() or is_admin());
create policy bookings_ins on session_bookings for insert
  with check (user_id = auth.uid() or is_admin());
create policy bookings_upd on session_bookings for update
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());
create policy bookings_del on session_bookings for delete
  using (is_admin());
