import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resetPasswordSchema } from '@/lib/validations/auth';
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

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Reset link expired or already used' }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
