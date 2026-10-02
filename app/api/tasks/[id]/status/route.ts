import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrg, isResponse, jsonError } from '@/lib/server/api';
import { emitNotification } from '@/lib/server/notify';

export const dynamic = 'force-dynamic';

const schema = z.object({
  status: z.enum(['todo', 'in_progress', 'in_review', 'blocked', 'done']),
  blocker_reason: z.string().max(500).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { status, blocker_reason } = parsed.data;

  const update: Record<string, unknown> = { status };
  if (status === 'blocked') {
    update.is_blocked = true;
    if (blocker_reason) update.blocker_reason = blocker_reason;
  } else {
    update.is_blocked = false;
    update.blocker_reason = null;
  }

  // completed_at is set by the trg_tasks_before_iu trigger, not here.
  const { data, error } = await ctx.supabase
    .from('tasks')
    .update(update)
    .eq('id', params.id)
    .is('deleted_at', null)
    .select('id, task_key, title, status, sprint_id, assignee_id, reporter_id, is_blocked, blocker_reason, completed_at')
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Task not found, or you cannot edit it', 404);

  try {
    const recipients = [data.assignee_id, data.reporter_id].filter(Boolean) as string[];
    await emitNotification({
      orgId: ctx.orgId,
      userIds: recipients,
      actorId: ctx.userId,
      type: status === 'blocked' ? 'task_blocked' : 'task_status_changed',
      title:
        status === 'blocked'
          ? `${data.task_key} is blocked`
          : `${data.task_key} moved to ${status.replace('_', ' ')}`,
      body: data.title,
      link: data.sprint_id ? `/sprints/${data.sprint_id}` : '/tasks',
      taskId: data.id,
      sprintId: data.sprint_id,
    });
  } catch (e) {
    console.error('[tasks/status] notification fan-out failed', e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ task: data });
}
