-- triage_sessions: one row per completed backlog-classification job run.
-- Deliberately explicit (not derived from audit_log timestamp-clustering,
-- which would be fragile against Step 27's concurrent-batch timestamps) so
-- the dashboard's "last scan" summary is exact, not a heuristic guess.
create table if not exists public.triage_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  processed_count integer not null,
  priority_count integer not null
);

create index if not exists triage_sessions_user_completed_idx
  on public.triage_sessions (user_id, completed_at desc);

-- RLS enabled in the same migration that creates the table (unlike
-- 0001-0005, which had a window before 0006 added RLS) — no reason to
-- leave a new table unprotected even briefly.
alter table public.triage_sessions enable row level security;

drop policy if exists "triage_sessions_select_own" on public.triage_sessions;
create policy "triage_sessions_select_own" on public.triage_sessions
  for select using (user_id = auth.uid());

drop policy if exists "triage_sessions_insert_own" on public.triage_sessions;
create policy "triage_sessions_insert_own" on public.triage_sessions
  for insert with check (user_id = auth.uid());

drop policy if exists "triage_sessions_update_own" on public.triage_sessions;
create policy "triage_sessions_update_own" on public.triage_sessions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "triage_sessions_delete_own" on public.triage_sessions;
create policy "triage_sessions_delete_own" on public.triage_sessions
  for delete using (user_id = auth.uid());
