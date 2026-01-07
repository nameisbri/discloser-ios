-- Discloser Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- PROFILES TABLE
-- Extended user info beyond Supabase auth.users
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'User'));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- TEST RESULTS TABLE
-- Core table for storing STI test results
-- ============================================
create type test_status as enum ('negative', 'positive', 'pending', 'inconclusive');

create table if not exists public.test_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  test_date date not null,
  status test_status default 'pending' not null,
  test_type text not null default 'Full STI Panel',
  sti_results jsonb default '[]'::jsonb,
  file_url text,
  file_name text,
  notes text,
  is_verified boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.test_results enable row level security;

-- Test results policies
create policy "Users can view their own test results"
  on public.test_results for select
  using (auth.uid() = user_id);

create policy "Users can insert their own test results"
  on public.test_results for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own test results"
  on public.test_results for update
  using (auth.uid() = user_id);

create policy "Users can delete their own test results"
  on public.test_results for delete
  using (auth.uid() = user_id);

-- Index for faster queries
create index if not exists test_results_user_id_idx on public.test_results(user_id);
create index if not exists test_results_test_date_idx on public.test_results(test_date desc);

-- ============================================
-- SHARE LINKS TABLE
-- Time-limited shareable links for test results
-- ============================================
create table if not exists public.share_links (
  id uuid default gen_random_uuid() primary key,
  test_result_id uuid references public.test_results(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null,
  view_count integer default 0,
  max_views integer,
  show_name boolean default false,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.share_links enable row level security;

-- Share links policies (owner can manage)
create policy "Users can view their own share links"
  on public.share_links for select
  using (auth.uid() = user_id);

create policy "Users can insert share links for their results"
  on public.share_links for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own share links"
  on public.share_links for delete
  using (auth.uid() = user_id);

-- Public access for valid tokens (used by share page)
create policy "Anyone can view share link by valid token"
  on public.share_links for select
  using (
    token = current_setting('request.headers', true)::json->>'x-share-token'
    and expires_at > now()
    and (max_views is null or view_count < max_views)
  );

-- Index for token lookups
create index if not exists share_links_token_idx on public.share_links(token);

-- ============================================
-- REMINDERS TABLE
-- Testing schedule reminders
-- ============================================
create type reminder_frequency as enum ('monthly', 'quarterly', 'biannual', 'annual');

create table if not exists public.reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  frequency reminder_frequency not null,
  next_date date not null,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.reminders enable row level security;

-- Reminders policies
create policy "Users can view their own reminders"
  on public.reminders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reminders"
  on public.reminders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reminders"
  on public.reminders for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reminders"
  on public.reminders for delete
  using (auth.uid() = user_id);

-- Index for user lookups
create index if not exists reminders_user_id_idx on public.reminders(user_id);

-- ============================================
-- STATUS SHARE LINKS TABLE
-- Share aggregated STI status (snapshot of all latest results)
-- ============================================
create table if not exists public.status_share_links (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null,
  view_count integer default 0,
  max_views integer,
  show_name boolean default false,
  display_name text,
  status_snapshot jsonb not null, -- Array of {name, status, result, testDate, isVerified}
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.status_share_links enable row level security;

-- Status share links policies
create policy "Users can view their own status share links"
  on public.status_share_links for select
  using (auth.uid() = user_id);

create policy "Users can insert their own status share links"
  on public.status_share_links for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own status share links"
  on public.status_share_links for delete
  using (auth.uid() = user_id);

-- Index for token lookups
create index if not exists status_share_links_token_idx on public.status_share_links(token);

-- Function to get shared status (public access)
create or replace function public.get_shared_status(share_token text)
returns table (
  status_snapshot jsonb,
  show_name boolean,
  display_name text,
  is_valid boolean
) as $$
begin
  -- Increment view count
  update public.status_share_links
  set view_count = view_count + 1
  where token = share_token
    and expires_at > now()
    and (max_views is null or view_count < max_views);

  return query
  select
    ssl.status_snapshot,
    ssl.show_name,
    ssl.display_name,
    true as is_valid
  from public.status_share_links ssl
  where ssl.token = share_token
    and ssl.expires_at > now()
    and (ssl.max_views is null or ssl.view_count <= ssl.max_views);
end;
$$ language plpgsql security definer;

-- ============================================
-- STORAGE BUCKET
-- For test result documents (PDFs, images)
-- ============================================
-- Create bucket (run once in SQL editor):
insert into storage.buckets (id, name, public)
values ('test-documents', 'test-documents', false)
on conflict (id) do nothing;

-- Storage RLS policies
create policy "Users can upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'test-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own files"
  on storage.objects for select
  using (
    bucket_id = 'test-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'test-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to increment share link view count
create or replace function public.increment_share_view(share_token text)
returns void as $$
begin
  update public.share_links
  set view_count = view_count + 1
  where token = share_token
    and expires_at > now()
    and (max_views is null or view_count < max_views);
end;
$$ language plpgsql security definer;

-- Function to get share link with test result (for public share page)
create or replace function public.get_shared_result(share_token text)
returns table (
  test_date date,
  status test_status,
  test_type text,
  sti_results jsonb,
  is_verified boolean,
  show_name boolean,
  display_name text
) as $$
begin
  return query
  select 
    tr.test_date,
    tr.status,
    tr.test_type,
    tr.sti_results,
    tr.is_verified,
    sl.show_name,
    case when sl.show_name then p.display_name else null end
  from public.share_links sl
  join public.test_results tr on tr.id = sl.test_result_id
  left join public.profiles p on p.id = sl.user_id
  where sl.token = share_token
    and sl.expires_at > now()
    and (sl.max_views is null or sl.view_count < sl.max_views);
end;
$$ language plpgsql security definer;

-- Updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger set_test_results_updated_at
  before update on public.test_results
  for each row execute procedure public.handle_updated_at();

create trigger set_reminders_updated_at
  before update on public.reminders
  for each row execute procedure public.handle_updated_at();

