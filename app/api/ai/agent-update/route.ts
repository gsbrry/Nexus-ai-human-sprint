import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { requireOrg, isResponse, jsonError, hasRole } from '@/lib/server/api';
import { orgForAgentApiKey, rotateAgentApiKey, revokeAgentApiKey } from '@/lib/server/telegram';
import { agentForApiKey } from '@/lib/server/agents';
import { emitNotification } from '@/lib/server/notify';
import { recordAudit } from '@/lib/server/audit';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  task_id: z.string().uuid(),
  update_text: z.string().trim().min(1).max(5000),
  new_status: z.enum(['todo', 'in_progress', 'in_review', 'blocked', 'done']).optional(),
  agent_name: z.string().trim().max(80).optional(),
});

/**
 * POST /api/ai/agent-update — Mode 3, webhook variant.
 *
 * An external AI agent authenticates with the workspace agent key (header
 * `x-nexus-agent-key`), posts an update, and optionally moves the task. The
 * comment lands with source `ai_agent`, so it renders with the purple robot
 * badge and is filterable in the task thread.
 *
 * The paste variant needs no key: an SM posts through /api/comments with
 * source `ai_agent`.
 */
export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return jsonError('Auth not configured on this deployment', 503);
  }

  const key = request.headers.get('x-nexus-agent-key') ?? '';

  // A per-agent key identifies WHICH agent posted, so the comment and any task
  // move are attributed to it. The older workspace-level key still works and
  // posts as a generic agent.
  const agent = await agentForApiKey(key);
  const orgId = agent?.orgId ?? (await orgForAgentApiKey(key));
  if (!orgId) return jsonError('Invalid or missing agent key', 401);
  if (agent && agent.status === 'paused') {
    return jsonError(`Agent ${agent.name} is paused`, 403);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { task_id, update_text, new_status, agent_name } = parsed.data;

  // Service client: the caller is a machine with no Supabase session, so the org
  // scope is enforced here by matching the task's org to the key's org.
  const admin = createServiceClient();

  const { data: task } = await admin
    .from('tasks')
    .select('id, org_id, task_key, title, sprint_id, assignee_id, reporter_id')
    .eq('id', task_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!task || task.org_id !== orgId) {
    return jsonError('Task not found in this workspace', 404);
  }

  const displayName = agent?.name ?? agent_name ?? 'AI agent';

  const { data: comment, error: commentError } = await admin
    .from('comments')
    .insert({
      org_id: orgId,
      task_id,
      author_id: null,
      agent_id: agent?.id ?? null,
      source: 'ai_agent',
      body: update_text,
      metadata: { author_name: displayName, via: 'webhook' },
    })
    .select('id, created_at')
    .single();

  if (commentError) return jsonError(commentError.message, 400);

  let statusChanged = false;
  if (new_status) {
    const update: Record<string, unknown> = { status: new_status };
    update.is_blocked = new_status === 'blocked';
    if (new_status !== 'blocked') update.blocker_reason = null;
    const { error } = await admin.from('tasks').update(update).eq('id', task_id);
    if (error) return jsonError(error.message, 400);
    statusChanged = true;
  }

  await admin.from('ai_interactions').insert({
    org_id: orgId,
    task_id,
    interaction_type: 'agent_update',
    source: 'webhook',
    response_text: update_text.slice(0, 20_000),
    status: 'success',
    metadata: { agent_id: agent?.id ?? null, agent_name: displayName, new_status: new_status ?? null },
  });

  await emitNotification({
    orgId,
    userIds: [task.assignee_id, task.reporter_id].filter(Boolean) as string[],
    type: 'ai_agent_update',
    title: `${displayName} posted on ${task.task_key}`,
    body: update_text.length > 220 ? `${update_text.slice(0, 217)}…` : update_text,
    link: task.sprint_id ? `/sprints/${task.sprint_id}` : '/tasks',
    taskId: task.id,
    sprintId: task.sprint_id,
  });

  // actor_id stays null: the actor is a machine, not a profile.
  await recordAudit({
    orgId,
    action: 'insert',
    table: 'comments',
    recordId: comment.id,
    metadata: {
      task_id,
      source: 'ai_agent',
      agent_id: agent?.id ?? null,
      agent_name: displayName,
      new_status: new_status ?? null,
    },
    request,
  });

  return NextResponse.json(
    { ok: true, comment_id: comment.id, status_changed: statusChanged },
    { status: 201 }
  );
}

/** GET — whether this workspace has an agent key issued. Never returns the key. */
export async function GET() {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const { data } = await ctx.supabase
    .from('org_integrations_status')
    .select('has_agent_api_key')
    .eq('org_id', ctx.orgId)
    .maybeSingle();

  return NextResponse.json({ has_agent_api_key: Boolean(data?.has_agent_api_key) });
}

/**
 * PUT — issue or rotate the agent key. This is the ONLY response that ever
 * contains the key: it is shown once, then never retrievable.
 */
export async function PUT() {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'org_admin')) {
    return jsonError('Only an org admin can issue an agent key', 403);
  }

  try {
    const key = await rotateAgentApiKey(ctx.orgId, ctx.userId);
    await recordAudit({
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: 'update',
      table: 'org_integrations',
      recordId: ctx.orgId,
      metadata: { field: 'agent_api_key', operation: 'issued' },
    });
    return NextResponse.json({ ok: true, agent_api_key: key, shown_once: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Could not issue a key', 400);
  }
}

/** DELETE — revoke the agent key. */
export async function DELETE() {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'org_admin')) {
    return jsonError('Only an org admin can revoke the agent key', 403);
  }

  try {
    await revokeAgentApiKey(ctx.orgId, ctx.userId);
    await recordAudit({
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: 'update',
      table: 'org_integrations',
      recordId: ctx.orgId,
      metadata: { field: 'agent_api_key', operation: 'revoked' },
    });
    return NextResponse.json({ ok: true, has_agent_api_key: false });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Could not revoke the key', 400);
  }
}
