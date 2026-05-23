import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  if (!isAuthConfigured() || !code) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
