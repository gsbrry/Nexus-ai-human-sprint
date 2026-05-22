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
