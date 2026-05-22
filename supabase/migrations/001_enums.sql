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
