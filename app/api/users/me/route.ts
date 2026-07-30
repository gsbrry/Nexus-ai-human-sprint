import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/users/me
 * Returns the current profile row (safe fields only — never anthropic_api_key).
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, telegram_chat_id, timezone, metadata, created_at')
    .eq('id', user.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data });
}

/**
 * PATCH /api/users/me
 * Updates safe profile fields. Never touches anthropic_api_key — use /api-keys route.
 */
export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let body: {
    full_name?: string;
    timezone?: string;
    telegram_chat_id?: string;
    bio?: string;
    telegram_handle?: string;
    notification_prefs?: Record<string, boolean>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Merge freeform fields into metadata JSONB so we don't need a schema change.
  const { data: existing } = await supabase
    .from('profiles')
    .select('metadata')
    .eq('id', user.id)
    .single();
  const currentMeta = (existing?.metadata ?? {}) as Record<string, unknown>;
  const metaPatch: Record<string, unknown> = {};
  if (body.bio !== undefined) metaPatch.bio = body.bio.slice(0, 500);
  if (body.telegram_handle !== undefined) metaPatch.telegram_handle = body.telegram_handle;
  if (body.notification_prefs !== undefined) metaPatch.notification_prefs = body.notification_prefs;
  const nextMeta = { ...currentMeta, ...metaPatch };

  const patch: Record<string, unknown> = { metadata: nextMeta };
  if (body.full_name !== undefined) patch.full_name = body.full_name.slice(0, 120);
  if (body.timezone !== undefined) patch.timezone = body.timezone.slice(0, 60);
  if (body.telegram_chat_id !== undefined) patch.telegram_chat_id = body.telegram_chat_id;

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select('id, full_name, timezone, telegram_chat_id, metadata')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data });
}
