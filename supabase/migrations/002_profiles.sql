-- 002_profiles.sql
-- Per-user profile rows linked to auth.users.
-- anthropic_api_key is stored here and MUST NEVER be returned to the client.
-- A safe view (profiles_safe) is provided that excludes this column.

begin;

-- Shared updated_at trigger function (reused by every table with updated_at)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           citext not null unique,
  full_name       text,
  avatar_url      text,
  role            user_role not null default 'member',
  -- Sensitive. NEVER expose via SELECT * — use profiles_safe view.
  anthropic_api_key text,
  telegram_chat_id  text,
  timezone        text not null default 'UTC',
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

-- Indexes
create index profiles_role_idx
  on public.profiles (role)
  where deleted_at is null;

create index profiles_deleted_at_idx
  on public.profiles (deleted_at);

-- Updated_at trigger
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Safe public view — NEVER includes anthropic_api_key.
create or replace view public.profiles_safe as
select
  id,
  email,
  full_name,
  avatar_url,
  role,
  telegram_chat_id,
  timezone,
  metadata,
  created_at,
  updated_at,
  deleted_at
from public.profiles;

-- RLS
alter table public.profiles enable row level security;

-- Users can read their own row.
create policy "profiles_self_select"
  on public.profiles for select
  using (id = auth.uid());

-- Users can update their own row.
create policy "profiles_self_update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Super admins can read all profiles (for SA-02 screen).
create policy "profiles_super_admin_select"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
        and p.deleted_at is null
    )
  );

-- Block client INSERT — profiles are created exclusively via the auth trigger.
create policy "profiles_no_client_insert"
  on public.profiles for insert
  with check (false);

commit;
