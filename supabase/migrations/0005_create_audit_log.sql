-- audit_log: every automated action taken, with reversal capability.
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email_id uuid references public.emails(id) on delete set null,
  action text not null,
  previous_state jsonb,
  new_state jsonb,
  reversible_until timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_user_id_created_at_idx
  on public.audit_log (user_id, created_at desc);
