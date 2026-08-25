-- backlog_jobs: tracks whether a backlog scan is currently in flight for a
-- user, distinct from triage_sessions (which only records a completed run's
-- summary). Created at enqueue time by the API route, updated to
-- 'completed'/'failed' by the worker — lets the dashboard show a live
-- "scanning your inbox" state instead of a stale empty state while a job
-- (onboarding's first scan, or a "Check now") is still running.
create table if not exists public.backlog_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  date_range text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists backlog_jobs_user_status_idx
  on public.backlog_jobs (user_id, status);

alter table public.backlog_jobs enable row level security;

drop policy if exists "backlog_jobs_select_own" on public.backlog_jobs;
create policy "backlog_jobs_select_own" on public.backlog_jobs
  for select using (user_id = auth.uid());

drop policy if exists "backlog_jobs_insert_own" on public.backlog_jobs;
create policy "backlog_jobs_insert_own" on public.backlog_jobs
  for insert with check (user_id = auth.uid());

drop policy if exists "backlog_jobs_update_own" on public.backlog_jobs;
create policy "backlog_jobs_update_own" on public.backlog_jobs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "backlog_jobs_delete_own" on public.backlog_jobs;
create policy "backlog_jobs_delete_own" on public.backlog_jobs
  for delete using (user_id = auth.uid());
