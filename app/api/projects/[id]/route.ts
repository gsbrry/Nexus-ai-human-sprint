import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrg, isResponse, jsonError, hasRole } from '@/lib/server/api';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('projects')
    .select('id, key, name, description, status, color, start_date, target_date, created_at')
    .eq('id', params.id)
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Project not found', 404);
  return NextResponse.json({ project: data });
}

/** PATCH — P-03 edit. The key is immutable: task_key values already embed it. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'scrum_master')) {
    return jsonError('Only a scrum master or admin can edit a project', 403);
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
    .from('projects')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .select('id, key, name, status, color')
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Project not found', 404);
  return NextResponse.json({ project: data });
}

/** DELETE — soft delete only. Hard deletes are revoked across the schema. */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'org_admin')) {
    return jsonError('Only an org admin can archive a project', 403);
  }

  const { data, error } = await ctx.supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString(), status: 'archived' })
    .eq('id', params.id)
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Project not found', 404);
  return NextResponse.json({ ok: true, id: data.id });
}
