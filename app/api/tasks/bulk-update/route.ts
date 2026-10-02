import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrg, isResponse, jsonError } from '@/lib/server/api';

export const dynamic = 'force-dynamic';

const schema = z.object({
  task_ids: z.array(z.string().uuid()).min(1).max(200),
  /** Every field is optional; at least one must be present. */
  status: z.enum(['todo', 'in_progress', 'in_review', 'blocked', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  sprint_id: z.string().uuid().nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
});

/**
 * PATCH /api/tasks/bulk-update — backlog grooming: move a selection into a
 * sprint, reassign, or re-prioritise in one call. RLS still scopes the write, and
 * org_id is pinned here too so a crafted id list cannot reach another workspace.
 */
export async function PATCH(request: Request) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { task_ids, ...fields } = parsed.data;
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) update[k] = v;
  }
  if (Object.keys(update).length === 0) return jsonError('Nothing to update', 400);

  if (update.status === 'blocked') {
    update.is_blocked = true;
  } else if (update.status) {
    update.is_blocked = false;
    update.blocker_reason = null;
  }

  const { data, error } = await ctx.supabase
    .from('tasks')
    .update(update)
    .in('id', task_ids)
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .select('id');

  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ updated: data?.length ?? 0, requested: task_ids.length });
}
