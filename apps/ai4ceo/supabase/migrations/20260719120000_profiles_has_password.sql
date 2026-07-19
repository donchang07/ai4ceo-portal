-- Tracks whether the user has set a password yet (first login is magic-link only,
-- then they're routed to /set-password so subsequent logins can use email+password).
alter table profiles add column if not exists has_password boolean not null default false;
