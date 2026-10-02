import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrg, isResponse, jsonError, hasRole } from '@/lib/server/api';
import { recordAudit } from '@/lib/server/audit';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  key: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .regex(/^[A-Za-z][A-Za-z0-9]*$/, 'Key must start with a letter and contain letters and digits only')
    .transform((v) => v.toUpperCase()),
  description: z.string().trim().max(2000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #1a73e8').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

/** GET /api/projects — the workspace's live projects with task counts. */
export async function GET() {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('projects')
    .select('id, key, name, description, status, color, start_date, target_date, created_at')
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ projects: data ?? [] });
}

/** POST /api/projects — P-03 create. Scrum master and above. */
export async function POST(request: Request) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'scrum_master')) {
    return jsonError('Only a scrum master or admin can create a project', 403);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { data, error } = await ctx.supabase
    .from('projects')
    .insert({ ...parsed.data, org_id: ctx.orgId, created_by: ctx.userId })
    .select('id, key, name, status, color')
    .single();

  if (error) {
    // 23505 is the (org_id, key) unique index.
    const message = error.code === '23505' ? `Project key ${parsed.data.key} is already in use` : error.message;
    return jsonError(message, 400);
  }

  await recordAudit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'insert',
    table: 'projects',
    recordId: data.id,
    newData: data,
    request,
  });

  return NextResponse.json({ project: data }, { status: 201 });
}
