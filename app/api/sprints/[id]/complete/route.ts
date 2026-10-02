import { NextResponse } from 'next/server';
import { requireOrg, isResponse, jsonError, hasRole } from '@/lib/server/api';
import { emitNotification } from '@/lib/server/notify';

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
    .select('id, status, story_points, assignee_id')
    .eq('sprint_id', sprint.id)
    .is('deleted_at', null);

  if (taskError) return jsonError(taskError.message, 400);
  const taskList = (tasks ?? []) as {
    id: string;
    status: string;
    story_points: number | null;
    assignee_id: string | null;
  }[];

  const snapshotDate = new Date().toISOString().slice(0, 10);
  const base = {
    org_id: ctx.orgId,
    project_id: sprint.project_id,
    sprint_id: sprint.id,
    snapshot_date: snapshotDate,
  };

  // Sprint-level row, then one per contributor.
  const perUser = new Map<string | null, typeof taskList>();
  perUser.set(null, taskList);
  for (const t of taskList) {
    const key = t.assignee_id;
    if (!key) continue;
    perUser.set(key, [...(perUser.get(key) ?? []), t]);
  }

  const rows = Array.from(perUser.entries()).map(([userId, list]) => {
    const done = list.filter((t) => t.status === 'done');
    return {
      ...base,
      user_id: userId,
      points_committed: list.reduce((s, t) => s + (t.story_points ?? 0), 0),
      points_completed: done.reduce((s, t) => s + (t.story_points ?? 0), 0),
      tasks_committed: list.length,
      tasks_completed: done.length,
    };
  });

  const { error: snapError } = await ctx.supabase
    .from('velocity_snapshots')
    .upsert(rows, { onConflict: 'sprint_id,user_id,snapshot_date' });
  if (snapError) return jsonError(snapError.message, 400);

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
