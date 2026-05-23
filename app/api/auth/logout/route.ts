import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';

export async function POST() {
  if (!isAuthConfigured()) {
    return NextResponse.json({ ok: true });
  }
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
