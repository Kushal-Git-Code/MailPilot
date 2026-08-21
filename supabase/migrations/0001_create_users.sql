-- users: app account, 1:1 with a Supabase Auth user.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  plan text not null default 'free',
  daily_email_count integer not null default 0,
  daily_count_reset_at timestamptz not null default now()
);
