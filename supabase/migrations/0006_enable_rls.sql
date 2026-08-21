-- Row Level Security: a user can only read/write their own rows, enforced
-- at the database level. The worker uses the Supabase service role key,
-- which bypasses RLS entirely (by design — it acts on behalf of many users).
--
-- Policies are dropped-then-created so this migration is safe to re-run
-- (CREATE POLICY has no built-in IF NOT EXISTS).

-- users: matched on its own primary key (equals the Supabase Auth user id),
-- since this table has no separate user_id column.
alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (id = auth.uid());

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert with check (id = auth.uid());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "users_delete_own" on public.users;
create policy "users_delete_own" on public.users
  for delete using (id = auth.uid());

-- gmail_tokens
alter table public.gmail_tokens enable row level security;

drop policy if exists "gmail_tokens_select_own" on public.gmail_tokens;
create policy "gmail_tokens_select_own" on public.gmail_tokens
  for select using (user_id = auth.uid());

drop policy if exists "gmail_tokens_insert_own" on public.gmail_tokens;
create policy "gmail_tokens_insert_own" on public.gmail_tokens
  for insert with check (user_id = auth.uid());

drop policy if exists "gmail_tokens_update_own" on public.gmail_tokens;
create policy "gmail_tokens_update_own" on public.gmail_tokens
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "gmail_tokens_delete_own" on public.gmail_tokens;
create policy "gmail_tokens_delete_own" on public.gmail_tokens
  for delete using (user_id = auth.uid());

-- emails
alter table public.emails enable row level security;

drop policy if exists "emails_select_own" on public.emails;
create policy "emails_select_own" on public.emails
  for select using (user_id = auth.uid());

drop policy if exists "emails_insert_own" on public.emails;
create policy "emails_insert_own" on public.emails
  for insert with check (user_id = auth.uid());

drop policy if exists "emails_update_own" on public.emails;
create policy "emails_update_own" on public.emails
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "emails_delete_own" on public.emails;
create policy "emails_delete_own" on public.emails
  for delete using (user_id = auth.uid());

-- rules
alter table public.rules enable row level security;

drop policy if exists "rules_select_own" on public.rules;
create policy "rules_select_own" on public.rules
  for select using (user_id = auth.uid());

drop policy if exists "rules_insert_own" on public.rules;
create policy "rules_insert_own" on public.rules
  for insert with check (user_id = auth.uid());

drop policy if exists "rules_update_own" on public.rules;
create policy "rules_update_own" on public.rules
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "rules_delete_own" on public.rules;
create policy "rules_delete_own" on public.rules
  for delete using (user_id = auth.uid());

-- audit_log
alter table public.audit_log enable row level security;

drop policy if exists "audit_log_select_own" on public.audit_log;
create policy "audit_log_select_own" on public.audit_log
  for select using (user_id = auth.uid());

drop policy if exists "audit_log_insert_own" on public.audit_log;
create policy "audit_log_insert_own" on public.audit_log
  for insert with check (user_id = auth.uid());

drop policy if exists "audit_log_update_own" on public.audit_log;
create policy "audit_log_update_own" on public.audit_log
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "audit_log_delete_own" on public.audit_log;
create policy "audit_log_delete_own" on public.audit_log
  for delete using (user_id = auth.uid());
