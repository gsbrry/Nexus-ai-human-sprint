import { NextResponse } from 'next/server';
import { requireOrg, isResponse, jsonError, hasRole } from '@/lib/server/api';
import { emitNotification } from '@/lib/server/notify';
import { createServiceClient } from '@/lib/supabase/server';
import { recordAudit } from '@/lib/server/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sprints/[id]/complete — closes a sprint and writes the velocity
 * snapshot the analytics screens read: one row for the sprint as a whole
 * (user_id null) and one per contributor.
 *
 * Unfinished tasks are returned to the backlog rather than carried silently, so
 * the next sprint starts from an explicit planning decision.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'scrum_master')) {
    return jsonError('Only a scrum master or admin can complete a sprint', 403);
  }

  const { data: sprint } = await ctx.supabase
    .from('sprints')
    .select('id, project_id, name, status')
    .eq('id', params.id)
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!sprint) return jsonError('Sprint not found', 404);
  if (sprint.status === 'completed') return jsonError('That sprint is already complete', 409);

  const { data: tasks, error: taskError } = await ctx.supabase
    .from('tasks')
    .select('id, status, story_points, assignee_id, agent_id')
    .eq('sprint_id', sprint.id)
    .is('deleted_at', null);

  if (taskError) return jsonError(taskError.message, 400);
  const taskList = (tasks ?? []) as {
    id: string;
    status: string;
    story_points: number | null;
    assignee_id: string | null;
    agent_id: string | null;
  }[];

  const snapshotDate = new Date().toISOString().slice(0, 10);
  const base = {
    org_id: ctx.orgId,
    project_id: sprint.project_id,
    sprint_id: sprint.id,
    snapshot_date: snapshotDate,
  };

  const totals = (list: typeof taskList) => {
    const done = list.filter((t) => t.status === 'done');
    return {
      points_committed: list.reduce((s, t) => s + (t.story_points ?? 0), 0),
      points_completed: done.reduce((s, t) => s + (t.story_points ?? 0), 0),
      tasks_committed: list.length,
      tasks_completed: done.length,
    };
  };

  // Sprint-level row, then one per human contributor, then one per agent.
  const byUser = new Map<string, typeof taskList>();
  const byAgent = new Map<string, typeof taskList>();
  for (const t of taskList) {
    if (t.assignee_id) byUser.set(t.assignee_id, [...(byUser.get(t.assignee_id) ?? []), t]);
    else if (t.agent_id) byAgent.set(t.agent_id, [...(byAgent.get(t.agent_id) ?? []), t]);
  }

  const userRows = [
    { ...base, user_id: null as string | null, agent_id: null, ...totals(taskList) },
    ...Array.from(byUser.entries()).map(([userId, list]) => ({
      ...base,
      user_id: userId,
      agent_id: null,
      ...totals(list),
    })),
  ];

  const agentRows = Array.from(byAgent.entries()).map(([agentId, list]) => ({
    ...base,
    user_id: null,
    agent_id: agentId,
    ...totals(list),
  }));

  // velocity_snapshots denies INSERT and UPDATE to every client role
  // (migration 009), so snapshots must be written with the service client.
  const admin = createServiceClient();

  const { error: snapError } = await admin
    .from('velocity_snapshots')
    .upsert(userRows, { onConflict: 'sprint_id,user_id,snapshot_date' });
  if (snapError) return jsonError(snapError.message, 400);

  if (agentRows.length > 0) {
    // Agent rows need their own conflict target: user_id is null on all of them,
    // and NULLs compare distinct, so the user-based index would not dedupe them.
    const { error } = await admin
      .from('velocity_snapshots')
      .upsert(agentRows, { onConflict: 'sprint_id,agent_id,snapshot_date' });
    if (error) return jsonError(error.message, 400);
  }

  const rows = userRows;

  // Unfinished work goes back to the backlog.
  const unfinished = taskList.filter((t) => t.status !== 'done').map((t) => t.id);
  if (unfinished.length > 0) {
    const { error } = await ctx.supabase
      .from('tasks')
      .update({ sprint_id: null })
      .in('id', unfinished);
    if (error) return jsonError(error.message, 400);
  }

  const { error: closeError } = await ctx.supabase
    .from('sprints')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', sprint.id);
  if (closeError) return jsonError(closeError.message, 400);

  const { data: members } = await ctx.supabase
    .from('org_members')
    .select('user_id')
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null);

  const summary = rows.find((r) => r.user_id === null);

  await recordAudit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'update',
    table: 'sprints',
    recordId: sprint.id,
    newData: { status: 'completed' },
    metadata: {
      returned_to_backlog: unfinished.length,
      points_completed: summary?.points_completed ?? 0,
      points_committed: summary?.points_committed ?? 0,
    },
  });
  await emitNotification({
    orgId: ctx.orgId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userIds: ((members ?? []) as any[]).map((m) => m.user_id as string),
    actorId: ctx.userId,
    type: 'sprint_completed',
    title: `${sprint.name} is complete`,
    body: `${summary?.points_completed ?? 0} of ${summary?.points_committed ?? 0} points delivered. ${unfinished.length} task(s) returned to the backlog.`,
    link: `/sprints/${sprint.id}`,
    sprintId: sprint.id,
  });

  return NextResponse.json({
    ok: true,
    returned_to_backlog: unfinished.length,
    velocity: summary ?? null,
  });
}
