import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrg, isResponse, jsonError } from '@/lib/server/api';
import { buildClaudePrompt } from '@/lib/import/prompt';
import { fetchOrgUsers } from '@/lib/server/org-users';

export const dynamic = 'force-dynamic';

const schema = z.object({
  project_id: z.string().uuid(),
  sprint_id: z.string().uuid().nullable().optional(),
  csv: z.string().min(1).max(200_000),
});

/**
 * POST /api/ai/claude-prompt — Mode 1. Builds the prompt server side from real
 * project, sprint and team context, so the user only has to copy and paste.
 */
export async function POST(request: Request) {
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

  const { data: project } = await ctx.supabase
    .from('projects')
    .select('id, key, name')
    .eq('id', parsed.data.project_id)
    .maybeSingle();
  if (!project) return jsonError('Project not found', 404);

  let sprint = null;
  if (parsed.data.sprint_id) {
    const { data } = await ctx.supabase
      .from('sprints')
      .select('name, start_date, end_date, goal')
      .eq('id', parsed.data.sprint_id)
      .maybeSingle();
    sprint = data ?? null;
  }

  const members = await fetchOrgUsers(ctx.supabase, ctx.orgId);

  const prompt = buildClaudePrompt({
    project,
    sprint,
    members: members.map((m) => ({ name: m.name, role: m.role })),
    csv: parsed.data.csv,
  });

  await ctx.supabase.from('ai_interactions').insert({
    org_id: ctx.orgId,
    user_id: ctx.userId,
    project_id: project.id,
    interaction_type: 'claude_prompt',
    source: 'manual_json',
    prompt_text: prompt,
  });

  return NextResponse.json({ prompt });
}
