import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrg, isResponse, jsonError, hasRole } from '@/lib/server/api';
import { recordAudit } from '@/lib/server/audit';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  provider: z.string().trim().max(60).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  initials: z.string().trim().min(1).max(3).optional(),
  /** Pausing keeps history intact but takes the agent out of the assignee list. */
  status: z.enum(['active', 'paused']).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'scrum_master')) {
    return jsonError('Only a scrum master or admin can edit an agent', 403);
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

  const update = parsed.data.initials
    ? { ...parsed.data, initials: parsed.data.initials.toUpperCase() }
    : parsed.data;

  const { data, error } = await ctx.supabase
    .from('agents')
    .update(update)
    .eq('id', params.id)
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .select('id, name, description, provider, color, initials, status')
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Agent not found', 404);

  await recordAudit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'update',
    table: 'agents',
    recordId: data.id,
    newData: update,
    request,
  });

  return NextResponse.json({ agent: data });
}

/**
 * DELETE — soft delete. Tasks the agent owns keep pointing at it, so the sprint
 * history still reads correctly; the agent simply stops being assignable.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'scrum_master')) {
    return jsonError('Only a scrum master or admin can remove an agent', 403);
  }

  const { data, error } = await ctx.supabase
    .from('agents')
    .update({ deleted_at: new Date().toISOString(), status: 'paused' })
    .eq('id', params.id)
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Agent not found', 404);

  await recordAudit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'soft_delete',
    table: 'agents',
    recordId: data.id,
    request,
  });

  return NextResponse.json({ ok: true, id: data.id });
}
