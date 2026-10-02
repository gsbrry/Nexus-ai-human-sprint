import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, isResponse, jsonError } from '@/lib/server/api';
import { NOTIFICATION_PREF_KEYS, normalisePrefs } from '@/lib/notification-prefs';

export const dynamic = 'force-dynamic';

const putSchema = z.object(
  Object.fromEntries(NOTIFICATION_PREF_KEYS.map((k) => [k, z.boolean()]))
);

export async function GET() {
  const ctx = await requireUser();
  if (isResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('profiles')
    .select('metadata')
    .eq('id', ctx.userId)
    .maybeSingle();

  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ preferences: normalisePrefs(data?.metadata?.notifications) });
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
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  // Read-modify-write so other metadata keys survive the update.
  const { data: current, error: readError } = await ctx.supabase
    .from('profiles')
    .select('metadata')
    .eq('id', ctx.userId)
    .maybeSingle();
  if (readError) return jsonError(readError.message, 400);

  const metadata = { ...(current?.metadata ?? {}), notifications: parsed.data };

  const { error } = await ctx.supabase.from('profiles').update({ metadata }).eq('id', ctx.userId);
  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ preferences: normalisePrefs(parsed.data) });
}
