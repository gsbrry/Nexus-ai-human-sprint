import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrg, isResponse, jsonError, hasRole } from '@/lib/server/api';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  goal: z.string().trim().max(1000).nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  capacity_points: z.number().int().min(0).max(999).optional(),
  status: z.enum(['planned', 'active', 'completed', 'cancelled']).optional(),
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('sprints')
    .select('id, project_id, name, goal, start_date, end_date, status, capacity_points, sprint_number, completed_at')
    .eq('id', params.id)
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Sprint not found', 404);
  return NextResponse.json({ sprint: data });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'scrum_master')) {
    return jsonError('Only a scrum master or admin can edit a sprint', 403);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  if (Object.keys(parsed.data).length === 0) return jsonError('Nothing to update', 400);

  const { data, error } = await ctx.supabase
    .from('sprints')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .select('id, name, status, start_date, end_date, capacity_points')
    .maybeSingle();

  if (error) {
    const message =
      error.code === '23505'
        ? 'That project already has an active sprint. Complete it first.'
        : error.message;
    return jsonError(message, 400);
  }
  if (!data) return jsonError('Sprint not found', 404);
  return NextResponse.json({ sprint: data });
}

/** DELETE — soft delete. Tasks keep their sprint_id reference intact. */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'scrum_master')) {
    return jsonError('Only a scrum master or admin can remove a sprint', 403);
  }

  const { data, error } = await ctx.supabase
    .from('sprints')
    .update({ deleted_at: new Date().toISOString(), status: 'cancelled' })
    .eq('id', params.id)
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Sprint not found', 404);
  return NextResponse.json({ ok: true, id: data.id });
}
