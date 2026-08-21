-- rules: user-defined overrides/preferences learned from corrections,
-- plus user's custom category definitions.
create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  rule_type text not null,
  rule_data jsonb not null,
  created_at timestamptz not null default now(),
  active boolean not null default true
);

create index if not exists rules_user_id_rule_type_idx
  on public.rules (user_id, rule_type);
