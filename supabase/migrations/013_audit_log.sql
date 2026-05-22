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
