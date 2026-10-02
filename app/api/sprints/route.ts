import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrg, isResponse, jsonError, hasRole } from '@/lib/server/api';

export const dynamic = 'force-dynamic';

const createSchema = z
  .object({
    project_id: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    goal: z.string().trim().max(1000).nullable().optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    capacity_points: z.number().int().min(0).max(999).optional(),
    status: z.enum(['planned', 'active']).optional(),
  })
  .refine((v) => v.end_date >= v.start_date, {
    message: 'End date must be on or after the start date',
    path: ['end_date'],
  });

/** GET /api/sprints — optionally filtered by project_id. */
export async function GET(request: Request) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const projectId = new URL(request.url).searchParams.get('project_id');

  let query = ctx.supabase
    .from('sprints')
    .select('id, project_id, name, goal, start_date, end_date, status, capacity_points, sprint_number')
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .order('sprint_number', { ascending: true });

  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query;
  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ sprints: data ?? [] });
}

/** POST /api/sprints — scrum master and above. */
export async function POST(request: Request) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'scrum_master')) {
    return jsonError('Only a scrum master or admin can create a sprint', 403);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  // sprint_number continues the project's own sequence.
  const { data: last } = await ctx.supabase
    .from('sprints')
    .select('sprint_number')
    .eq('project_id', parsed.data.project_id)
    .order('sprint_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await ctx.supabase
    .from('sprints')
    .insert({
      ...parsed.data,
      org_id: ctx.orgId,
      created_by: ctx.userId,
      sprint_number: (last?.sprint_number ?? 0) + 1,
    })
    .select('id, name, sprint_number, status, start_date, end_date')
    .single();

  if (error) {
    // sprints_one_active_per_project is a partial unique index.
    const message =
      error.code === '23505'
        ? 'That project already has an active sprint. Complete it first.'
        : error.message;
    return jsonError(message, 400);
  }

  return NextResponse.json({ sprint: data }, { status: 201 });
}
