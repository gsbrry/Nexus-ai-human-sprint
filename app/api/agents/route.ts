import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrg, isResponse, jsonError, hasRole } from '@/lib/server/api';
import { recordAudit } from '@/lib/server/audit';
import { initialsFor } from '@/lib/board';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(500).nullable().optional(),
  provider: z.string().trim().max(60).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  initials: z.string().trim().min(1).max(3).optional(),
});

/**
 * GET /api/agents — the workspace's AI agents, with their current workload.
 *
 * Agents are team members, so this returns the same shape the member list does
 * and the UI renders them side by side.
 */
export async function GET() {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const [{ data: agents, error }, { data: tasks }] = await Promise.all([
    ctx.supabase
      .from('agents')
      .select('id, name, description, provider, color, initials, status, created_at')
      .eq('org_id', ctx.orgId)
      .is('deleted_at', null)
      .order('name', { ascending: true }),
    ctx.supabase
      .from('tasks')
      .select('agent_id, status, story_points')
      .eq('org_id', ctx.orgId)
      .not('agent_id', 'is', null)
      .is('deleted_at', null),
  ]);

  if (error) return jsonError(error.message, 400);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (tasks ?? []) as any[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withLoad = (agents ?? []).map((a: any) => {
    const mine = rows.filter((t) => t.agent_id === a.id);
    const done = mine.filter((t) => t.status === 'done');
    return {
      ...a,
      kind: 'ai_agent' as const,
      open_tasks: mine.length - done.length,
      done_tasks: done.length,
      open_points: mine
        .filter((t) => t.status !== 'done')
        .reduce((s, t) => s + (t.story_points ?? 0), 0),
    };
  });

  return NextResponse.json({ agents: withLoad, role: ctx.role });
}

/** POST /api/agents — register an agent. Scrum master and above. */
export async function POST(request: Request) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'scrum_master')) {
    return jsonError('Only a scrum master or admin can add an agent', 403);
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
    .from('agents')
    .insert({
      org_id: ctx.orgId,
      created_by: ctx.userId,
      ...parsed.data,
      initials: parsed.data.initials?.toUpperCase() ?? initialsFor(parsed.data.name, 'AI'),
    })
    .select('id, name, description, provider, color, initials, status')
    .single();

  if (error) {
    const message =
      error.code === '23505' ? 'An agent with that name already exists here' : error.message;
    return jsonError(message, 400);
  }

  await recordAudit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'insert',
    table: 'agents',
    recordId: data.id,
    newData: data,
    request,
  });

  return NextResponse.json({ agent: data }, { status: 201 });
}
