import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrg, isResponse, jsonError } from '@/lib/server/api';
import { buildClaudePrompt } from '@/lib/import/prompt';
import { importPayloadSchema } from '@/lib/import/schema';
import { fetchOrgUsers } from '@/lib/server/org-users';
import { callClaude, getUserAnthropicKey, DEFAULT_CLAUDE_MODEL } from '@/lib/server/anthropic';

export const dynamic = 'force-dynamic';

const schema = z.object({
  project_id: z.string().uuid(),
  sprint_id: z.string().uuid().nullable().optional(),
  csv: z.string().min(1).max(200_000),
});

/** Claude is told to return bare JSON, but strip a code fence if one slips in. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
}

/**
 * POST /api/ai/generate-tasks — Mode 2. Uses the caller's own Anthropic key.
 * Without a key this returns 409 and the UI stays on the manual paste flow.
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

  const apiKey = await getUserAnthropicKey(ctx.userId);
  if (!apiKey) {
    return jsonError(
      'No Anthropic API key on your profile. Add one in Settings, or use the manual JSON flow.',
      409
    );
  }

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

  const logBase = {
    org_id: ctx.orgId,
    user_id: ctx.userId,
    project_id: project.id,
    interaction_type: 'generate_tasks' as const,
    source: 'api' as const,
    prompt_text: prompt,
  };

  try {
    const result = await callClaude({
      apiKey,
      system: 'You return strict JSON only. No prose, no markdown fences.',
      prompt,
      model: DEFAULT_CLAUDE_MODEL,
    });

    const jsonText = extractJson(result.text);
    let payload: unknown;
    try {
      payload = JSON.parse(jsonText);
    } catch {
      throw new Error('Claude did not return valid JSON. Try the manual flow for this file.');
    }

    const validated = importPayloadSchema.safeParse(payload);
    if (!validated.success) {
      throw new Error(
        `Claude's JSON did not match the import schema: ${validated.error.issues[0]?.message ?? 'unknown field'}`
      );
    }

    await ctx.supabase.from('ai_interactions').insert({
      ...logBase,
      model: result.model,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      response_text: result.text.slice(0, 20_000),
      status: 'success',
    });

    return NextResponse.json({
      payload: validated.data,
      usage: { input_tokens: result.inputTokens, output_tokens: result.outputTokens, model: result.model },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Claude call failed';
    await ctx.supabase.from('ai_interactions').insert({
      ...logBase,
      status: 'error',
      error_message: message.slice(0, 1000),
    });
    return jsonError(message, 400);
  }
}
