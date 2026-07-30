import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/users/me/api-keys
 * Returns a MASKED representation of each configured key. Never the raw value.
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data, error } = await supabase
    .from('profiles')
    .select('anthropic_api_key, metadata')
    .eq('id', user.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const meta = (data?.metadata ?? {}) as Record<string, string | undefined>;
  return NextResponse.json({
    anthropic_api_key: mask(data?.anthropic_api_key),
    resend_api_key: mask(meta.resend_api_key),
    telegram_bot_token: mask(meta.telegram_bot_token),
  });
}

/**
 * PATCH /api/users/me/api-keys
 * Body: { anthropic_api_key?, resend_api_key?, telegram_bot_token? }
 * Empty string clears the key.
 */
export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let body: {
    anthropic_api_key?: string;
    resend_api_key?: string;
    telegram_bot_token?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('metadata')
    .eq('id', user.id)
    .single();
  const currentMeta = (existing?.metadata ?? {}) as Record<string, unknown>;
  const metaPatch: Record<string, unknown> = { ...currentMeta };
  if (body.resend_api_key !== undefined)
    metaPatch.resend_api_key = body.resend_api_key.trim() || null;
  if (body.telegram_bot_token !== undefined)
    metaPatch.telegram_bot_token = body.telegram_bot_token.trim() || null;

  const patch: Record<string, unknown> = { metadata: metaPatch };
  if (body.anthropic_api_key !== undefined) {
    const trimmed = body.anthropic_api_key.trim();
    patch.anthropic_api_key = trimmed || null;
  }

  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

function mask(v: string | null | undefined): string | null {
  if (!v) return null;
  if (v.length <= 16) return '••••••••';
  return v.slice(0, 6) + '•'.repeat(Math.min(20, v.length - 10)) + v.slice(-4);
}
