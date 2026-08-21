drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "users_delete_own" on public.users;
alter table public.users disable row level security;

drop policy if exists "gmail_tokens_select_own" on public.gmail_tokens;
drop policy if exists "gmail_tokens_insert_own" on public.gmail_tokens;
drop policy if exists "gmail_tokens_update_own" on public.gmail_tokens;
drop policy if exists "gmail_tokens_delete_own" on public.gmail_tokens;
alter table public.gmail_tokens disable row level security;

drop policy if exists "emails_select_own" on public.emails;
drop policy if exists "emails_insert_own" on public.emails;
drop policy if exists "emails_update_own" on public.emails;
drop policy if exists "emails_delete_own" on public.emails;
alter table public.emails disable row level security;

drop policy if exists "rules_select_own" on public.rules;
drop policy if exists "rules_insert_own" on public.rules;
drop policy if exists "rules_update_own" on public.rules;
drop policy if exists "rules_delete_own" on public.rules;
alter table public.rules disable row level security;

drop policy if exists "audit_log_select_own" on public.audit_log;
drop policy if exists "audit_log_insert_own" on public.audit_log;
drop policy if exists "audit_log_update_own" on public.audit_log;
drop policy if exists "audit_log_delete_own" on public.audit_log;
alter table public.audit_log disable row level security;
