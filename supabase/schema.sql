-- ShaadiSaathi planner storage.
-- Run this once in the Supabase SQL editor.
--
-- The app stores the whole planner as one JSON document so lists, trips,
-- and calendar links stay in sync. This policy allows the anon key to read
-- and write that document. Do not ship the anon key in a public website
-- until you replace these policies with authenticated access.

create table if not exists public.planner_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.planner_state enable row level security;

drop policy if exists "shaadisaathi anon read" on public.planner_state;
drop policy if exists "shaadisaathi anon insert" on public.planner_state;
drop policy if exists "shaadisaathi anon update" on public.planner_state;

create policy "shaadisaathi anon read"
  on public.planner_state
  for select
  to anon, authenticated
  using (true);

create policy "shaadisaathi anon insert"
  on public.planner_state
  for insert
  to anon, authenticated
  with check (true);

create policy "shaadisaathi anon update"
  on public.planner_state
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- Sign-in accounts and sessions. The app creates these on first login too.
-- Row level security stays on and the anon key has no access, so password
-- hashes are only reachable through DATABASE_URL on the server.

create table if not exists public.app_users (
  id uuid primary key,
  email text not null unique,
  name text not null,
  role text not null check (role in ('owner', 'member')),
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.app_sessions (
  id uuid primary key,
  user_id uuid not null references public.app_users (id) on delete cascade,
  expires_at timestamptz not null
);

create index if not exists app_sessions_user_id_idx on public.app_sessions (user_id);

alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;

revoke all on table public.app_users from anon, authenticated;
revoke all on table public.app_sessions from anon, authenticated;
