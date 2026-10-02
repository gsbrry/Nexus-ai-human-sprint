import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, isResponse, jsonError } from '@/lib/server/api';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  full_name: z.string().trim().min(1).max(120).optional(),
  timezone: z.string().trim().max(64).optional(),
  telegram_chat_id: z.string().trim().max(64).nullable().optional(),
});

/** GET /api/users/me — the signed-in profile. Never includes the Anthropic key. */
export async function GET() {
  const ctx = await requireUser();
  if (isResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, telegram_chat_id, timezone, metadata, created_at')
    .eq('id', ctx.userId)
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Profile not found', 404);

  // has_anthropic_key() is SECURITY DEFINER: it reports presence, not the value.
  const { data: hasKey } = await ctx.supabase.rpc('has_anthropic_key');

  return NextResponse.json({ profile: { ...data, has_anthropic_key: Boolean(hasKey) } });
}

/** PATCH /api/users/me — update your own profile fields. */
export async function PATCH(request: Request) {
  const ctx = await requireUser();
  if (isResponse(ctx)) return ctx;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  if (Object.keys(parsed.data).length === 0) return jsonError('Nothing to update', 400);

  const { error } = await ctx.supabase.from('profiles').update(parsed.data).eq('id', ctx.userId);
  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ ok: true });
}
