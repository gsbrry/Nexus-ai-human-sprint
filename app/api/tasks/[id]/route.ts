import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { taskUpdateSchema } from '@/lib/validations/task';
import { requireOrg, isResponse, jsonError } from '@/lib/server/api';
import { recordAudit } from '@/lib/server/audit';

export const dynamic = 'force-dynamic';

/** GET /api/tasks/[id] — T-03 task detail, including its comment thread. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('tasks')
    .select(
      'id, task_key, title, description, project_id, sprint_id, status, priority, type, ' +
        'story_points, is_blocked, blocker_reason, assignee_id, reporter_id, due_date, ' +
        'created_at, completed_at, projects(id, key, name)'
    )
    .eq('id', params.id)
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Task not found', 404);

  return NextResponse.json({ task: data });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: 'Auth not configured. Add Supabase keys to .env.local then restart the server.' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = taskUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { data, error } = await supabase
    .from('tasks')
    .update(parsed.data)
    .eq('id', params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ task: data });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  // Soft delete per @David's rule — never hard delete tasks.
  const { data, error } = await ctx.supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Task not found', 404);

  await recordAudit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'soft_delete',
    table: 'tasks',
    recordId: data.id,
  });

  return NextResponse.json({ ok: true, id: data.id });
}
