import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordAudit } from '@/lib/server/audit';
import { loginSchema } from '@/lib/validations/auth';
import { isAuthConfigured } from '@/lib/auth-config';

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: 'Auth not configured. Add Supabase keys to .env.local then restart the server.' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Failed attempts are recorded too: a run of them is the signal worth seeing.
    await recordAudit({
      action: 'login',
      table: 'auth.users',
      metadata: { outcome: 'failed', email: parsed.data.email },
      request,
    });
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  await recordAudit({
    actorId: data.user?.id ?? null,
    action: 'login',
    table: 'auth.users',
    recordId: data.user?.id ?? null,
    metadata: { outcome: 'success' },
    request,
  });

  return NextResponse.json({ user: data.user, session: !!data.session });
}
