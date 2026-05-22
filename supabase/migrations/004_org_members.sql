-- 004_org_members.sql
-- Membership join table + auth helper functions used by every downstream RLS policy.

begin;

create table public.org_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organisations(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        user_role not null default 'member',
  invited_by  uuid references public.profiles(id) on delete set null,
  joined_at   timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (org_id, user_id)
);

create index org_members_org_id_idx on public.org_members (org_id) where deleted_at is null;
create index org_members_user_id_idx on public.org_members (user_id) where deleted_at is null;
create index org_members_role_idx on public.org_members (org_id, role) where deleted_at is null;

alter table public.org_members enable row level security;

-- ----------------------------------------------------------------------------
-- Helper functions (used by RLS policies on every org-scoped table)
-- ----------------------------------------------------------------------------

-- Returns true if the current user belongs to org_id (and is not soft-deleted).
create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members om
    where om.org_id = p_org_id
      and om.user_id = auth.uid()
      and om.deleted_at is null
  );
$$;

-- Returns the user's role in a given org, or null if not a member.
create or replace function public.user_role_in_org(p_org_id uuid)
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select om.role
  from public.org_members om
  where om.org_id = p_org_id
    and om.user_id = auth.uid()
    and om.deleted_at is null
  limit 1;
$$;

-- Returns true if the user is org_admin or super_admin within an org.
create or replace function public.is_org_admin(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_role_in_org(p_org_id) in ('org_admin', 'super_admin');
$$;

-- Returns true if the user is at least a scrum_master in the org.
create or replace function public.is_org_sm_or_above(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_role_in_org(p_org_id) in ('scrum_master', 'org_admin', 'super_admin');
$$;

-- Global super_admin flag.
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
      and p.deleted_at is null
  );
$$;

-- ----------------------------------------------------------------------------
-- RLS — org_members
-- ----------------------------------------------------------------------------

-- Members can read membership rows of orgs they belong to.
create policy "org_members_select_same_org"
  on public.org_members for select
  using (public.is_org_member(org_id) or public.is_super_admin());

-- Only org_admins can insert members (invitations).
create policy "org_members_insert_admin"
  on public.org_members for insert
  with check (public.is_org_admin(org_id) or public.is_super_admin());

-- Only org_admins can update membership (role changes).
create policy "org_members_update_admin"
  on public.org_members for update
  using (public.is_org_admin(org_id) or public.is_super_admin())
  with check (public.is_org_admin(org_id) or public.is_super_admin());

-- ----------------------------------------------------------------------------
-- RLS — organisations (deferred from 003 until helpers exist)
-- ----------------------------------------------------------------------------

create policy "organisations_select_member"
  on public.organisations for select
  using (public.is_org_member(id) or public.is_super_admin());

create policy "organisations_insert_any_authenticated"
  on public.organisations for insert
  with check (auth.uid() is not null);

create policy "organisations_update_admin"
  on public.organisations for update
  using (public.is_org_admin(id) or public.is_super_admin())
  with check (public.is_org_admin(id) or public.is_super_admin());

commit;
