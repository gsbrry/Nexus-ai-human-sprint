-- ===================================================================
-- File: 001_enums.sql
-- ===================================================================
-- 001_enums.sql
-- All custom enum types used across the NEXUS schema.
-- Run order: FIRST. No other migration may reference enums before this runs.

begin;

-- Required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists "citext";

-- Identity / roles
create type user_role as enum (
  'member',
  'scrum_master',
  'org_admin',
  'super_admin'
);

-- Projects
create type project_status as enum (
  'active',
  'archived',
  'completed'
);

-- Sprints
create type sprint_status as enum (
  'planned',
  'active',
  'completed',
  'cancelled'
);

-- Tasks
create type task_status as enum (
  'todo',
  'in_progress',
  'in_review',
  'blocked',
  'done'
);

create type task_priority as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create type task_type as enum (
  'feature',
  'bug',
  'chore',
  'spike',
  'epic'
);

-- Comments (human vs AI agent)
create type comment_source as enum (
  'human',
  'ai_agent'
);

-- AI interactions
create type ai_interaction_type as enum (
  'generate_tasks',
  'generate_sprint',
  'agent_update',
  'claude_prompt',
  'parse_csv'
);

create type ai_interaction_source as enum (
  'webhook',
  'api',
  'paste',
  'manual_json'
);

-- CSV imports
create type csv_import_status as enum (
  'pending',
  'parsing',
  'validating',
  'imported',
  'failed'
);

-- Notifications
create type notification_type as enum (
  'task_assigned',
  'task_status_changed',
  'task_commented',
  'task_blocked',
  'task_due_soon',
  'sprint_started',
  'sprint_completed',
  'sprint_velocity_at_risk',
  'mention',
  'invite',
  'ai_agent_update'
);

create type notification_channel as enum (
  'in_app',
  'email',
  'telegram'
);

-- Audit log
create type audit_action as enum (
  'insert',
  'update',
  'soft_delete',
  'restore',
  'login',
  'logout',
  'permission_change'
);

commit;

-- ===================================================================
-- File: 002_profiles.sql
-- ===================================================================
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

-- ===================================================================
-- File: 003_organisations.sql
-- ===================================================================
-- 003_organisations.sql
-- Tenant root. Every org-scoped record points back to organisations(id).

begin;

create table public.organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        citext not null unique,
  logo_url    text,
  settings    jsonb not null default '{}'::jsonb,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index organisations_slug_idx on public.organisations (slug) where deleted_at is null;
create index organisations_deleted_at_idx on public.organisations (deleted_at);

create trigger trg_organisations_updated_at
  before update on public.organisations
  for each row execute function public.set_updated_at();

alter table public.organisations enable row level security;

-- Policies are defined in 004_org_members.sql once helper functions exist.

commit;

-- ===================================================================
-- File: 004_org_members.sql
-- ===================================================================
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

-- ===================================================================
-- File: 005_projects.sql
-- ===================================================================
-- 005_projects.sql
-- Projects belong to a single organisation. Soft delete only.

begin;

create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organisations(id) on delete cascade,
  name          text not null,
  key           text not null,  -- e.g. 'GBM' — used to prefix task_key
  description   text,
  status        project_status not null default 'active',
  color         text default '#D4A843',
  created_by    uuid references public.profiles(id) on delete set null,
  start_date    date,
  target_date   date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (org_id, key)
);

create index projects_org_id_idx on public.projects (org_id) where deleted_at is null;
create index projects_status_idx on public.projects (org_id, status) where deleted_at is null;

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create policy "projects_select_org_members"
  on public.projects for select
  using (public.is_org_member(org_id) or public.is_super_admin());

create policy "projects_insert_sm_or_above"
  on public.projects for insert
  with check (public.is_org_sm_or_above(org_id));

create policy "projects_update_sm_or_above"
  on public.projects for update
  using (public.is_org_sm_or_above(org_id))
  with check (public.is_org_sm_or_above(org_id));

-- Hard DELETE never permitted from clients — use soft delete via UPDATE.
create policy "projects_no_delete"
  on public.projects for delete
  using (false);

commit;

-- ===================================================================
-- File: 006_sprints.sql
-- ===================================================================
-- 006_sprints.sql
-- Sprints belong to a project. org_id is DENORMALISED for fast RLS.

begin;

create table public.sprints (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organisations(id) on delete cascade,
  project_id      uuid not null references public.projects(id) on delete cascade,
  name            text not null,
  goal            text,
  start_date      date not null,
  end_date        date not null,
  status          sprint_status not null default 'planned',
  capacity_points integer default 0,
  sprint_number   integer not null default 1,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  completed_at    timestamptz,
  deleted_at      timestamptz,
  check (end_date >= start_date)
);

create index sprints_org_id_idx on public.sprints (org_id) where deleted_at is null;
create index sprints_project_id_idx on public.sprints (project_id) where deleted_at is null;
create index sprints_status_idx on public.sprints (project_id, status) where deleted_at is null;
create unique index sprints_one_active_per_project on public.sprints (project_id)
  where status = 'active' and deleted_at is null;

create trigger trg_sprints_updated_at
  before update on public.sprints
  for each row execute function public.set_updated_at();

-- Enforce that sprint.org_id matches the parent project.org_id.
create or replace function public.enforce_sprint_org_match()
returns trigger
language plpgsql
as $$
declare
  v_proj_org uuid;
begin
  select org_id into v_proj_org from public.projects where id = new.project_id;
  if v_proj_org is null then
    raise exception 'Project % not found', new.project_id;
  end if;
  if new.org_id is null then
    new.org_id := v_proj_org;
  elsif new.org_id <> v_proj_org then
    raise exception 'sprint.org_id (%) must match project.org_id (%)', new.org_id, v_proj_org;
  end if;
  return new;
end;
$$;

create trigger trg_sprints_org_match
  before insert or update on public.sprints
  for each row execute function public.enforce_sprint_org_match();

alter table public.sprints enable row level security;

create policy "sprints_select_org_members"
  on public.sprints for select
  using (public.is_org_member(org_id) or public.is_super_admin());

create policy "sprints_insert_sm_or_above"
  on public.sprints for insert
  with check (public.is_org_sm_or_above(org_id));

create policy "sprints_update_sm_or_above"
  on public.sprints for update
  using (public.is_org_sm_or_above(org_id))
  with check (public.is_org_sm_or_above(org_id));

create policy "sprints_no_delete"
  on public.sprints for delete using (false);

commit;

-- ===================================================================
-- File: 007_tasks.sql
-- ===================================================================
-- 007_tasks.sql
-- Core entity. org_id denormalised. task_key auto-generated as <PROJECT_KEY>-<N>.

begin;

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organisations(id) on delete cascade,
  project_id    uuid not null references public.projects(id) on delete cascade,
  sprint_id     uuid references public.sprints(id) on delete set null,
  parent_id     uuid references public.tasks(id) on delete set null,
  task_key      text not null,   -- e.g. 'GBM-42'
  title         text not null,
  description   text,
  status        task_status not null default 'todo',
  priority      task_priority not null default 'medium',
  type          task_type not null default 'feature',
  assignee_id   uuid references public.profiles(id) on delete set null,
  reporter_id   uuid references public.profiles(id) on delete set null,
  story_points  integer,
  position      integer not null default 0,
  is_blocked    boolean not null default false,
  blocker_reason text,
  due_date      date,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (project_id, task_key)
);

create index tasks_org_id_idx on public.tasks (org_id) where deleted_at is null;
create index tasks_project_id_idx on public.tasks (project_id) where deleted_at is null;
create index tasks_sprint_id_idx on public.tasks (sprint_id) where deleted_at is null;
create index tasks_assignee_id_idx on public.tasks (assignee_id) where deleted_at is null;
create index tasks_status_idx on public.tasks (sprint_id, status) where deleted_at is null;
create index tasks_due_date_idx on public.tasks (due_date) where deleted_at is null and status <> 'done';

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Per-project sequential counter for task_key generation.
create table public.project_task_counters (
  project_id uuid primary key references public.projects(id) on delete cascade,
  next_value bigint not null default 1
);

-- Set task_key, sync org_id with project, set completed_at on status -> done.
create or replace function public.tasks_before_insert_update()
returns trigger
language plpgsql
as $$
declare
  v_proj_org   uuid;
  v_proj_key   text;
  v_next       bigint;
begin
  -- Sync org_id with parent project
  select org_id, key into v_proj_org, v_proj_key
  from public.projects where id = new.project_id;

  if v_proj_org is null then
    raise exception 'Project % not found', new.project_id;
  end if;

  if tg_op = 'INSERT' then
    new.org_id := v_proj_org;

    -- Auto-generate task_key if blank
    if new.task_key is null or new.task_key = '' then
      insert into public.project_task_counters (project_id, next_value)
      values (new.project_id, 1)
      on conflict (project_id) do nothing;

      update public.project_task_counters
         set next_value = next_value + 1
       where project_id = new.project_id
      returning next_value - 1 into v_next;

      new.task_key := v_proj_key || '-' || v_next::text;
    end if;
  elsif new.org_id <> v_proj_org then
    raise exception 'task.org_id (%) must match project.org_id (%)', new.org_id, v_proj_org;
  end if;

  -- Stamp completed_at
  if new.status = 'done' and (old is null or old.status is distinct from 'done') then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

create trigger trg_tasks_before_iu
  before insert or update on public.tasks
  for each row execute function public.tasks_before_insert_update();

alter table public.tasks enable row level security;

create policy "tasks_select_org_members"
  on public.tasks for select
  using (public.is_org_member(org_id) or public.is_super_admin());

create policy "tasks_insert_org_members"
  on public.tasks for insert
  with check (public.is_org_member(org_id));

-- Members can update tasks in their org (assigning themselves, moving status).
-- Stricter rules (e.g. only assignee can mark done) belong in the API layer.
create policy "tasks_update_org_members"
  on public.tasks for update
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "tasks_no_delete"
  on public.tasks for delete using (false);

commit;

-- ===================================================================
-- File: 008_comments.sql
-- ===================================================================
-- 008_comments.sql
-- Task comments. source = 'ai_agent' enables the purple robot badge in the UI.
-- org_id denormalised for fast RLS.

begin;

create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organisations(id) on delete cascade,
  task_id      uuid not null references public.tasks(id) on delete cascade,
  author_id    uuid references public.profiles(id) on delete set null,
  source       comment_source not null default 'human',
  body         text not null,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index comments_task_id_idx on public.comments (task_id, created_at) where deleted_at is null;
create index comments_org_id_idx on public.comments (org_id) where deleted_at is null;
create index comments_source_idx on public.comments (task_id, source) where deleted_at is null;

create trigger trg_comments_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

-- Sync comments.org_id with parent task.org_id.
create or replace function public.enforce_comment_org_match()
returns trigger
language plpgsql
as $$
declare
  v_task_org uuid;
begin
  select org_id into v_task_org from public.tasks where id = new.task_id;
  if v_task_org is null then
    raise exception 'Task % not found', new.task_id;
  end if;
  new.org_id := v_task_org;
  return new;
end;
$$;

create trigger trg_comments_org_match
  before insert or update on public.comments
  for each row execute function public.enforce_comment_org_match();

alter table public.comments enable row level security;

create policy "comments_select_org_members"
  on public.comments for select
  using (public.is_org_member(org_id) or public.is_super_admin());

create policy "comments_insert_org_members"
  on public.comments for insert
  with check (public.is_org_member(org_id));

-- Authors can edit/soft-delete their own comments; SMs+ can edit any.
create policy "comments_update_author_or_sm"
  on public.comments for update
  using (
    public.is_org_member(org_id)
    and (author_id = auth.uid() or public.is_org_sm_or_above(org_id))
  )
  with check (
    public.is_org_member(org_id)
    and (author_id = auth.uid() or public.is_org_sm_or_above(org_id))
  );

create policy "comments_no_delete"
  on public.comments for delete using (false);

commit;

-- ===================================================================
-- File: 009_velocity_snapshots.sql
-- ===================================================================
-- 009_velocity_snapshots.sql
-- Daily-rolling velocity records per sprint per user, written by the sprint-completion job.

begin;

create table public.velocity_snapshots (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organisations(id) on delete cascade,
  project_id        uuid not null references public.projects(id) on delete cascade,
  sprint_id         uuid not null references public.sprints(id) on delete cascade,
  user_id           uuid references public.profiles(id) on delete set null,
  points_committed  integer not null default 0,
  points_completed  integer not null default 0,
  tasks_committed   integer not null default 0,
  tasks_completed   integer not null default 0,
  snapshot_date     date not null default current_date,
  created_at        timestamptz not null default now(),
  unique (sprint_id, user_id, snapshot_date)
);

create index velocity_org_project_idx on public.velocity_snapshots (org_id, project_id);
create index velocity_sprint_idx on public.velocity_snapshots (sprint_id);
create index velocity_user_idx on public.velocity_snapshots (user_id);

alter table public.velocity_snapshots enable row level security;

create policy "velocity_select_org_members"
  on public.velocity_snapshots for select
  using (public.is_org_member(org_id) or public.is_super_admin());

-- Writes happen via the service-role server context (sprint completion job).
create policy "velocity_no_client_write"
  on public.velocity_snapshots for insert with check (false);
create policy "velocity_no_client_update"
  on public.velocity_snapshots for update using (false);

commit;

-- ===================================================================
-- File: 010_ai_interactions.sql
-- ===================================================================
-- 010_ai_interactions.sql
-- Every AI call (Claude API, agent-update webhook, prompt-copy) is logged here.
-- prompt_text and response_text are stored verbatim for audit and cost tracking.

begin;

create table public.ai_interactions (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organisations(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete set null,
  project_id      uuid references public.projects(id) on delete set null,
  task_id         uuid references public.tasks(id) on delete set null,
  interaction_type ai_interaction_type not null,
  source          ai_interaction_source not null default 'api',
  model           text,                       -- e.g. 'claude-3-5-sonnet-20241022'
  input_tokens    integer default 0,
  output_tokens   integer default 0,
  cost_cents      integer default 0,          -- 1/100 USD
  prompt_text     text,
  response_text   text,
  status          text not null default 'success',  -- 'success' | 'error'
  error_message   text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index ai_interactions_org_user_idx on public.ai_interactions (org_id, user_id, created_at desc);
create index ai_interactions_type_idx on public.ai_interactions (org_id, interaction_type, created_at desc);

alter table public.ai_interactions enable row level security;

-- Org members can read AI interactions in their org (SMs need this for cost dashboards).
create policy "ai_interactions_select_org_members"
  on public.ai_interactions for select
  using (public.is_org_member(org_id) or public.is_super_admin());

create policy "ai_interactions_insert_org_members"
  on public.ai_interactions for insert
  with check (public.is_org_member(org_id));

-- Immutable once written.
create policy "ai_interactions_no_update"
  on public.ai_interactions for update using (false);
create policy "ai_interactions_no_delete"
  on public.ai_interactions for delete using (false);

commit;

-- ===================================================================
-- File: 011_csv_imports.sql
-- ===================================================================
-- 011_csv_imports.sql
-- Tracks each CSV upload → JSON → bulk-insert flow, with row-level errors retained.

begin;

create table public.csv_imports (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organisations(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete set null,
  project_id   uuid references public.projects(id) on delete set null,
  sprint_id    uuid references public.sprints(id) on delete set null,
  file_name    text not null,
  file_size    integer,
  row_count    integer default 0,
  rows_imported integer default 0,
  status       csv_import_status not null default 'pending',
  errors       jsonb not null default '[]'::jsonb,
  raw_json     jsonb,            -- the final JSON the user submitted
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

create index csv_imports_org_idx on public.csv_imports (org_id, created_at desc);
create index csv_imports_user_idx on public.csv_imports (user_id);

alter table public.csv_imports enable row level security;

create policy "csv_imports_select_org_sm"
  on public.csv_imports for select
  using (public.is_org_sm_or_above(org_id) or public.is_super_admin());

create policy "csv_imports_insert_org_sm"
  on public.csv_imports for insert
  with check (public.is_org_sm_or_above(org_id));

create policy "csv_imports_update_org_sm"
  on public.csv_imports for update
  using (public.is_org_sm_or_above(org_id))
  with check (public.is_org_sm_or_above(org_id));

create policy "csv_imports_no_delete"
  on public.csv_imports for delete using (false);

commit;

-- ===================================================================
-- File: 012_notifications.sql
-- ===================================================================
-- 012_notifications.sql
-- In-app notifications. The same row records whether email and telegram were sent.

begin;

create table public.notifications (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organisations(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  type              notification_type not null,
  title             text not null,
  body              text,
  link              text,
  task_id           uuid references public.tasks(id) on delete set null,
  sprint_id         uuid references public.sprints(id) on delete set null,
  metadata          jsonb not null default '{}'::jsonb,
  sent_via_email    boolean not null default false,
  sent_via_telegram boolean not null default false,
  read_at           timestamptz,
  created_at        timestamptz not null default now()
);

create index notifications_user_unread_idx
  on public.notifications (user_id, read_at, created_at desc);
create index notifications_org_idx on public.notifications (org_id);

alter table public.notifications enable row level security;

-- A user may only read their own notifications.
create policy "notifications_select_self"
  on public.notifications for select
  using (user_id = auth.uid());

-- A user may only mark their own as read.
create policy "notifications_update_self"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Server-only inserts (service role bypasses RLS — fanout happens server-side).
create policy "notifications_no_client_insert"
  on public.notifications for insert with check (false);

create policy "notifications_no_client_delete"
  on public.notifications for delete using (false);

commit;

-- ===================================================================
-- File: 013_audit_log.sql
-- ===================================================================
-- 013_audit_log.sql
-- Immutable audit trail. UPDATE and DELETE are REVOKED entirely — not policy-restricted.
-- Per David's non-negotiable: once a row lands here, it cannot be altered or removed.

begin;

create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.organisations(id) on delete set null,
  actor_id    uuid references public.profiles(id) on delete set null,
  action      audit_action not null,
  table_name  text not null,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  ip_address  inet,
  user_agent  text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index audit_log_org_idx on public.audit_log (org_id, created_at desc);
create index audit_log_actor_idx on public.audit_log (actor_id, created_at desc);
create index audit_log_table_record_idx on public.audit_log (table_name, record_id);

alter table public.audit_log enable row level security;

-- Read is restricted to org_admins for their own org, plus super_admin.
create policy "audit_log_select_admin"
  on public.audit_log for select
  using (
    (org_id is not null and public.is_org_admin(org_id))
    or public.is_super_admin()
  );

-- Inserts permitted only via service-role server context (which bypasses RLS).
create policy "audit_log_no_client_insert"
  on public.audit_log for insert with check (false);

-- HARD REVOKE — not just policy-blocked. UPDATE and DELETE cannot be granted again
-- without an explicit migration. This is the David Rule.
revoke update on public.audit_log from public, anon, authenticated, service_role;
revoke delete on public.audit_log from public, anon, authenticated, service_role;

commit;

