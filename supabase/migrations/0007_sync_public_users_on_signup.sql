-- Every Supabase Auth signup (email, Google, or admin-created) must get a
-- matching public.users row — other tables (gmail_tokens, emails, rules,
-- audit_log) all FK to public.users, not auth.users directly.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
