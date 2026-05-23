import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { isAuthConfigured } from '@/lib/auth-config';

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ ok: true }); // silently no-op pre-config
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const supabase = createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  // Don't reveal whether the email exists.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  });

  return NextResponse.json({ ok: true });
}
