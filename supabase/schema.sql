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
