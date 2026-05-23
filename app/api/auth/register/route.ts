import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { registerSchema } from '@/lib/validations/auth';
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const { email, password, full_name } = parsed.data;
  const supabase = createClient();

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
      data: { full_name },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user, session: !!data.session });
}
