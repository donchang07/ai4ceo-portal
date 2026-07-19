-- AI4CEO Portal MVP schema (PRD v2.6 §6.3)
-- Design Ref: §3 Data Model. Apply order: this file, then seed.
-- NOTE: Do NOT apply automatically — apply via Supabase MCP from the main session.

create extension if not exists pgcrypto;

-- ---------- enums ----------
do $$ begin
  create type user_role as enum ('guest','applicant','student','assistant','alumni','admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type enrollment_status as enum ('invited','invoiced','paid','enrolled','in_training','completed','dropped');
exception when duplicate_object then null; end $$;
do $$ begin
  create type application_status as enum ('received','reviewing','accepted','rejected','waitlist');
exception when duplicate_object then null; end $$;
do $$ begin
  create type session_type as enum ('regular_zoom','offline_supplement','coaching','special');
exception when duplicate_object then null; end $$;
do $$ begin
  create type invoice_status as enum ('issued','paid','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type payment_method as enum ('bank_transfer','smartstore','toss');
exception when duplicate_object then null; end $$;
do $$ begin
  create type payment_status as enum ('pending','approved','cancelled','failed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type tax_provider as enum ('manual','popbill');
exception when duplicate_object then null; end $$;
do $$ begin
  create type tax_status as enum ('requested','issuing','issued','failed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type membership_status as enum ('active','expired','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type post_board as enum ('notice','qna','as_qna','brief','ai_trend');
exception when duplicate_object then null; end $$;
do $$ begin
  create type post_audience as enum ('public','student','alumni','admin_only');
exception when duplicate_object then null; end $$;
do $$ begin
  create type chat_role as enum ('student','assistant','instructor','admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type message_type as enum ('text','system','assignment','notice','question','file','link','ai_answer');
exception when duplicate_object then null; end $$;
do $$ begin
  create type notify_channel as enum ('alimtalk','email','sms');
exception when duplicate_object then null; end $$;
do $$ begin
  create type notify_status as enum ('queued','sent','failed');
exception when duplicate_object then null; end $$;

-- ---------- tables ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  company text,
  title text,
  phone text,
  role user_role not null default 'applicant',
  marketing_opt_in boolean default false,
  directory_opt_in boolean default false,
  created_at timestamptz default now()
);

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  owner_user_id uuid references profiles(id),
  label text,
  created_at timestamptz default now()
);

create table if not exists curriculum_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  description text,
  snapshot jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  recruit_start date,
  recruit_end date,
  edu_start timestamptz,
  edu_end timestamptz,
  capacity int default 24,
  status text default 'active',
  curriculum_template_id uuid references curriculum_templates(id),
  curriculum_version_label text
);

create table if not exists cohort_version_packs (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references cohorts(id) on delete cascade,
  version_label text not null,
  source_cohort_id uuid references cohorts(id),
  curriculum_snapshot jsonb,
  schedule_snapshot jsonb,
  materials_snapshot jsonb,
  videos_snapshot jsonb,
  drive_folder_snapshot jsonb,
  change_summary text,
  locked_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references cohorts(id),
  name text not null,
  company text,
  title text,
  phone text,
  email text,
  motivation text,
  status application_status not null default 'received',
  referral_code text,
  created_at timestamptz default now()
);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  cohort_id uuid references cohorts(id),
  status enrollment_status not null default 'invited',
  attendance_rate numeric default 0,
  build_count int default 0,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references cohorts(id) on delete cascade,
  week_no int,
  title text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  type session_type not null default 'regular_zoom',
  place text,
  zoom_url text,
  capacity int,
  description text,
  track text,
  source_template_session_id uuid,
  content_version int default 1,
  is_published boolean default true
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  title text not null,
  file_path text,
  version int default 1,
  publish_at timestamptz
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  google_drive_file_id text,
  google_drive_url text,
  title text,
  duration_sec int,
  visibility text default 'cohort_readonly',
  transcript_status text default 'none',
  summary_mdx text,
  uploaded_by uuid references profiles(id),
  published_at timestamptz
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references cohorts(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references assignments(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text,
  file_path text,
  status text default 'submitted',
  feedback text,
  submitted_at timestamptz default now()
);

create table if not exists builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  cohort_id uuid references cohorts(id),
  title text,
  description text,
  media_path text,
  repo_url text,
  stage text default 'problem',
  applied_to_company boolean default false,
  visibility text default 'cohort',
  created_at timestamptz default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references enrollments(id) on delete cascade,
  number text unique,
  biz_name text,
  biz_reg_no text,
  amount int not null default 2200000,
  method payment_method default 'bank_transfer',
  status invoice_status not null default 'issued',
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists tax_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  biz_doc_path text,
  provider tax_provider default 'manual',
  popbill_mgt_key text,
  nts_confirm_num text,
  status tax_status default 'requested',
  issued_at timestamptz
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  provider payment_method not null,
  provider_payment_key text,
  method text,
  amount int,
  status payment_status default 'pending',
  approved_at timestamptz,
  raw_webhook jsonb
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  plan text default 'annual',
  price_krw int default 550000,
  status membership_status default 'active',
  started_at timestamptz default now(),
  expires_at timestamptz
);

create table if not exists chat_rooms (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references cohorts(id) on delete cascade,
  type text default 'cohort',
  title text,
  status text default 'open',
  google_drive_folder_id text,
  google_drive_folder_url text,
  created_at timestamptz default now()
);

create table if not exists chat_members (
  id uuid primary key default gen_random_uuid(),
  chat_room_id uuid references chat_rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role chat_role default 'student',
  last_read_message_id uuid,
  muted boolean default false,
  joined_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_room_id uuid references chat_rooms(id) on delete cascade,
  author_id uuid references profiles(id),
  body text,
  message_type message_type default 'text',
  pinned boolean default false,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists chat_files (
  id uuid primary key default gen_random_uuid(),
  chat_room_id uuid references chat_rooms(id) on delete cascade,
  chat_message_id uuid references chat_messages(id) on delete set null,
  google_drive_file_id text,
  google_drive_url text,
  name text,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references profiles(id),
  permission text default 'cohort_rw',
  created_at timestamptz default now()
);

create table if not exists ai_question_logs (
  id uuid primary key default gen_random_uuid(),
  chat_room_id uuid references chat_rooms(id),
  video_id uuid references videos(id),
  user_id uuid references profiles(id),
  question text,
  answer text,
  topic text default 'other',
  model text,
  context_refs jsonb,
  status text default 'answered',
  created_at timestamptz default now()
);

create table if not exists ai_context_sources (
  id uuid primary key default gen_random_uuid(),
  ai_question_log_id uuid references ai_question_logs(id) on delete cascade,
  source_type text,
  source_id text,
  source_title text,
  source_url text,
  confidence numeric,
  created_at timestamptz default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  board post_board not null,
  cohort_id uuid references cohorts(id),
  author_id uuid references profiles(id),
  title text not null,
  body_mdx text,
  excerpt text,
  thumbnail_path text,
  external_url text,
  category text,
  tags text[],
  audience post_audience default 'public',
  published_at timestamptz default now()
);

create table if not exists curriculum_change_logs (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references cohorts(id) on delete cascade,
  entity_type text,
  entity_id uuid,
  changed_by uuid references profiles(id),
  change_summary text,
  before_json jsonb,
  after_json jsonb,
  notify_students boolean default false,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  phone text,
  channel notify_channel not null,
  template_code text,
  payload jsonb,
  status notify_status default 'queued',
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- ---------- helper functions ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_enrolled(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from enrollments e
    where e.cohort_id = c and e.user_id = auth.uid()
      and e.status in ('enrolled','in_training','completed')
  );
$$;

-- ---------- RLS ----------
-- Design Ref: PRD 6.3 RLS 원칙
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','referrals','curriculum_templates','cohorts','cohort_version_packs',
    'applications','enrollments','sessions','materials','videos','assignments',
    'submissions','builds','invoices','tax_invoices','payments','memberships',
    'chat_rooms','chat_members','chat_messages','chat_files','ai_question_logs',
    'ai_context_sources','posts','curriculum_change_logs','notifications'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- profiles: self read/update, admin all
create policy profiles_self_sel on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_self_upd on profiles for update using (id = auth.uid() or is_admin());
create policy profiles_self_ins on profiles for insert with check (id = auth.uid() or is_admin());

-- public reference data: everyone reads, admin writes
create policy cohorts_read on cohorts for select using (true);
create policy cohorts_admin on cohorts for all using (is_admin()) with check (is_admin());
create policy templates_read on curriculum_templates for select using (true);
create policy templates_admin on curriculum_templates for all using (is_admin()) with check (is_admin());
create policy referrals_read on referrals for select using (true);
create policy referrals_admin on referrals for all using (is_admin()) with check (is_admin());

-- version packs: admin only
create policy vpacks_admin on cohort_version_packs for all using (is_admin()) with check (is_admin());
create policy vpacks_read on cohort_version_packs for select using (is_admin() or is_enrolled(cohort_id));

-- applications: admin only (applicant access handled via server actions / token)
create policy applications_admin on applications for all using (is_admin()) with check (is_admin());
create policy applications_insert on applications for insert with check (true); -- public apply form

-- enrollments: self read, admin all
create policy enrollments_self on enrollments for select using (user_id = auth.uid() or is_admin());
create policy enrollments_admin on enrollments for all using (is_admin()) with check (is_admin());

-- sessions / materials: enrolled read, admin write
create policy sessions_read on sessions for select using (is_admin() or is_enrolled(cohort_id) or is_published);
create policy sessions_admin on sessions for all using (is_admin()) with check (is_admin());
create policy materials_read on materials for select using (
  is_admin() or exists(select 1 from sessions s where s.id = session_id and is_enrolled(s.cohort_id))
);
create policy materials_admin on materials for all using (is_admin()) with check (is_admin());

-- videos: enrolled/alumni read-only, admin manage
create policy videos_read on videos for select using (
  is_admin() or exists(select 1 from sessions s where s.id = session_id and is_enrolled(s.cohort_id))
);
create policy videos_admin on videos for all using (is_admin()) with check (is_admin());

-- assignments / submissions
create policy assignments_read on assignments for select using (is_admin() or is_enrolled(cohort_id));
create policy assignments_admin on assignments for all using (is_admin()) with check (is_admin());
create policy submissions_self on submissions for select using (user_id = auth.uid() or is_admin());
create policy submissions_ins on submissions for insert with check (user_id = auth.uid());
create policy submissions_upd on submissions for update using (user_id = auth.uid() or is_admin());

-- builds: owner + public
create policy builds_read on builds for select using (visibility = 'public' or user_id = auth.uid() or is_admin());
create policy builds_own on builds for all using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());

-- billing: self or admin
create policy invoices_self on invoices for select using (
  is_admin() or exists(select 1 from enrollments e where e.id = enrollment_id and e.user_id = auth.uid())
);
create policy invoices_admin on invoices for all using (is_admin()) with check (is_admin());
create policy taxinv_self on tax_invoices for select using (
  is_admin() or exists(select 1 from invoices i join enrollments e on e.id = i.enrollment_id where i.id = invoice_id and e.user_id = auth.uid())
);
create policy taxinv_admin on tax_invoices for all using (is_admin()) with check (is_admin());
create policy payments_admin on payments for all using (is_admin()) with check (is_admin());
create policy memberships_self on memberships for select using (user_id = auth.uid() or is_admin());
create policy memberships_admin on memberships for all using (is_admin()) with check (is_admin());

-- chat: cohort members + admin
create policy chatrooms_read on chat_rooms for select using (is_admin() or is_enrolled(cohort_id));
create policy chatrooms_admin on chat_rooms for all using (is_admin()) with check (is_admin());
create policy chatmembers_read on chat_members for select using (user_id = auth.uid() or is_admin());
create policy chatmembers_admin on chat_members for all using (is_admin()) with check (is_admin());
create policy chatmsg_read on chat_messages for select using (
  is_admin() or exists(select 1 from chat_members m where m.chat_room_id = chat_messages.chat_room_id and m.user_id = auth.uid())
);
create policy chatmsg_ins on chat_messages for insert with check (
  author_id = auth.uid() and exists(select 1 from chat_members m where m.chat_room_id = chat_messages.chat_room_id and m.user_id = auth.uid())
);
create policy chatfiles_read on chat_files for select using (
  is_admin() or exists(select 1 from chat_members m where m.chat_room_id = chat_files.chat_room_id and m.user_id = auth.uid())
);
create policy chatfiles_ins on chat_files for insert with check (
  uploaded_by = auth.uid() and exists(select 1 from chat_members m where m.chat_room_id = chat_files.chat_room_id and m.user_id = auth.uid())
);

-- AI logs: owner + admin
create policy ailogs_self on ai_question_logs for select using (user_id = auth.uid() or is_admin());
create policy ailogs_ins on ai_question_logs for insert with check (user_id = auth.uid() or user_id is null);
create policy aisrc_read on ai_context_sources for select using (
  is_admin() or exists(select 1 from ai_question_logs l where l.id = ai_question_log_id and l.user_id = auth.uid())
);
create policy aisrc_ins on ai_context_sources for insert with check (true);

-- posts: audience-based read, admin write
create policy posts_read on posts for select using (
  audience = 'public'
  or is_admin()
  or (audience = 'student' and exists(select 1 from enrollments e where e.user_id = auth.uid()))
  or (audience = 'alumni' and exists(select 1 from enrollments e where e.user_id = auth.uid() and e.status in ('completed')))
);
create policy posts_admin on posts for all using (is_admin()) with check (is_admin());

-- change logs: admin
create policy changelogs_admin on curriculum_change_logs for all using (is_admin()) with check (is_admin());
create policy changelogs_read on curriculum_change_logs for select using (is_admin() or is_enrolled(cohort_id));

-- notifications: self + admin
create policy notif_self on notifications for select using (user_id = auth.uid() or is_admin());
create policy notif_admin on notifications for all using (is_admin()) with check (is_admin());
create policy notif_ins on notifications for insert with check (true);
