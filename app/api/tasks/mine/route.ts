import { NextResponse } from 'next/server';
import { requireOrg, isResponse, jsonError } from '@/lib/server/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tasks/mine — T-06. Raphy's call: this spans every project by
 * default, with `project_id` narrowing it for the project/all toggle.
 */
export async function GET(request: Request) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const url = new URL(request.url);
  const projectId = url.searchParams.get('project_id');
  const includeDone = url.searchParams.get('include_done') === 'true';

  let query = ctx.supabase
    .from('tasks')
    .select(
      'id, task_key, title, description, project_id, sprint_id, status, priority, type, ' +
        'story_points, is_blocked, blocker_reason, assignee_id, reporter_id, due_date, created_at, completed_at'
    )
    .eq('org_id', ctx.orgId)
    .eq('assignee_id', ctx.userId)
    .is('deleted_at', null)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (projectId) query = query.eq('project_id', projectId);
  if (!includeDone) query = query.neq('status', 'done');

  const { data, error } = await query;
  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ tasks: data ?? [] });
}
