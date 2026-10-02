-- 017_agents.sql
--
-- AI agents as first-class, assignable team members.
--
-- Until now an AI agent could only comment on a task. It could not own one, so
-- the product's core claim — human teams and AI agents working side by side in
-- the same sprint — was not actually modelled.
--
-- Why a separate table rather than synthetic profiles: profiles.id is a foreign
-- key to auth.users, so giving an agent a profile would mean minting a fake auth
-- user per agent, with a password, an email and a login path nobody should ever
-- use. Agents are not people and should not be able to sign in. They get their
-- own table and their own nullable foreign key wherever a human can be named.
begin;

create type agent_status as enum ('active', 'paused');

create table public.agents (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organisations(id) on delete cascade,
  name        text not null,
  description text,
  -- Free text: 'Claude Code', 'internal RAG pipeline', whatever the team runs.
  provider    text,
  color       text not null default '#7F77DD',
  initials    text not null default 'AI',
  status      agent_status not null default 'active',
  -- Per-agent webhook credential, so an update is attributed to THIS agent
  -- rather than to a generic workspace poster. Revoked from clients below.
  api_key     text unique,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (org_id, name)
);

create index agents_org_id_idx on public.agents (org_id) where deleted_at is null;

create trigger trg_agents_updated_at
  before update on public.agents
  for each row execute function public.set_updated_at();

alter table public.agents enable row level security;

create policy "agents_select_org_members"
  on public.agents for select
  using (public.is_org_member(org_id) or public.is_super_admin());

create policy "agents_insert_sm"
  on public.agents for insert
  with check (public.is_org_sm_or_above(org_id));

create policy "agents_update_sm"
  on public.agents for update
  using (public.is_org_sm_or_above(org_id))
  with check (public.is_org_sm_or_above(org_id));

create policy "agents_no_delete"
  on public.agents for delete using (false);

-- Same treatment as profiles.anthropic_api_key: the column is never readable by
-- a client role, only by service_role from a server route.
revoke select on public.agents from anon, authenticated;
grant select (
  id, org_id, name, description, provider, color, initials,
  status, created_by, created_at, updated_at, deleted_at
) on public.agents to authenticated;

revoke update on public.agents from anon, authenticated;
grant update (
  name, description, provider, color, initials, status, deleted_at, updated_at
) on public.agents to authenticated;

grant insert on public.agents to authenticated;

-- ---------------------------------------------------------------------------
-- Agent assignment
-- ---------------------------------------------------------------------------

alter table public.tasks
  add column agent_id uuid references public.agents(id) on delete set null;

-- A task has at most one owner, human or agent, never both.
alter table public.tasks
  add constraint tasks_single_assignee
  check (assignee_id is null or agent_id is null);

create index tasks_agent_id_idx on public.tasks (agent_id) where deleted_at is null;

-- Agent-authored comments name the agent instead of relying on a metadata blob.
alter table public.comments
  add column agent_id uuid references public.agents(id) on delete set null;

-- Agents earn velocity like anyone else, so the sprint report can split the
-- delivered points between the humans and the machines.
alter table public.velocity_snapshots
  add column agent_id uuid references public.agents(id) on delete set null;

-- The original unique (sprint_id, user_id, snapshot_date) does not constrain
-- agent rows, because user_id is null on those and NULLs compare distinct.
create unique index velocity_snapshots_agent_unique
  on public.velocity_snapshots (sprint_id, agent_id, snapshot_date)
  where agent_id is not null;

create index velocity_agent_idx on public.velocity_snapshots (agent_id);

commit;
