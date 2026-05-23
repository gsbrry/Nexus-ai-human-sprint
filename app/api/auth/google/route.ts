import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: 'Auth not configured. Add Supabase keys to .env.local then restart the server.' },
      { status: 503 }
    );
  }

  const supabase = createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/api/auth/callback` },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ url: data.url });
}
