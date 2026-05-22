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
