import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, isResponse, jsonError } from '@/lib/server/api';
import { recordAudit } from '@/lib/server/audit';

export const dynamic = 'force-dynamic';

const putSchema = z.object({
  anthropic_api_key: z
    .string()
    .trim()
    .min(20, 'That does not look like an Anthropic API key')
    .max(300)
    .regex(/^sk-ant-/, 'Anthropic keys start with "sk-ant-"'),
});

/**
 * Bring-your-own Anthropic key.
 *
 * The key is only ever written, never read back: GET reports presence and a
 * last-four hint derived server side, and the column itself is revoked from every
 * client role in migration 014. Mode 2 (API-connected import) turns on for this
 * user the moment a key is saved; with no key the app stays on Mode 1 manual JSON.
 */
export async function GET() {
  const ctx = await requireUser();
  if (isResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase.rpc('has_anthropic_key');
  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ has_anthropic_key: Boolean(data) });
}

export async function PUT(request: Request) {
  const ctx = await requireUser();
  if (isResponse(ctx)) return ctx;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = putSchema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid key', 400);

  const { error } = await ctx.supabase
    .from('profiles')
    .update({ anthropic_api_key: parsed.data.anthropic_api_key })
    .eq('id', ctx.userId);

  if (error) return jsonError(error.message, 400);

  await recordAudit({
    actorId: ctx.userId,
    action: 'update',
    table: 'profiles',
    recordId: ctx.userId,
    newData: { anthropic_api_key: parsed.data.anthropic_api_key },
    metadata: { field: 'anthropic_api_key', operation: 'set' },
    request,
  });

  // No echo of the key, not even masked.
  return NextResponse.json({ ok: true, has_anthropic_key: true });
}

export async function DELETE() {
  const ctx = await requireUser();
  if (isResponse(ctx)) return ctx;

  const { error } = await ctx.supabase
    .from('profiles')
    .update({ anthropic_api_key: null })
    .eq('id', ctx.userId);

  if (error) return jsonError(error.message, 400);

  await recordAudit({
    actorId: ctx.userId,
    action: 'update',
    table: 'profiles',
    recordId: ctx.userId,
    metadata: { field: 'anthropic_api_key', operation: 'cleared' },
  });

  return NextResponse.json({ ok: true, has_anthropic_key: false });
}
