import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { mockUsers } from '@/lib/mock/yallo';

const COOKIE_NAME = 'nexus_demo_user';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Demo sign-in bypass — no Supabase required.
 *
 * Sets a `nexus_demo_user` cookie containing the chosen mock user id. The app layout
 * reads it and treats that user as the active viewer for the entire session.
 *
 * Works even when Supabase IS configured: the middleware checks for this cookie
 * alongside the real sb-auth-token, so demo and real auth coexist.
 */
export async function POST(request: Request) {
  let body: { user_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const user = mockUsers.find((u) => u.id === body.user_id);
  if (!user) {
    return NextResponse.json({ error: 'Unknown demo user' }, { status: 400 });
  }

  cookies().set({
    name: COOKIE_NAME,
    value: user.id,
    httpOnly: false, // readable from client so the topbar can show switcher
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });

  return NextResponse.json({ user });
}

export async function DELETE() {
  cookies().delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
