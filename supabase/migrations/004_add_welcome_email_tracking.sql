-- Add welcome_email_sent_at to profiles for duplicate prevention
alter table public.profiles
  add column if not exists welcome_email_sent_at timestamptz;
