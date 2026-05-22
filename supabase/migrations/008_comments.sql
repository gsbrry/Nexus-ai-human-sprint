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
