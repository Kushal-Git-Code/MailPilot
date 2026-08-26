alter table public.emails
  drop column if exists quick_reply_candidate;

alter table public.emails
  drop column if exists has_deadline;
