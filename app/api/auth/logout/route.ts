import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordAudit } from '@/lib/server/audit';
import { isAuthConfigured } from '@/lib/auth-config';

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ ok: true });
  }
  const supabase = createClient();

  // Read the user before signing out, so the entry has an actor.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.auth.signOut();

  if (user) {
    await recordAudit({
      actorId: user.id,
      action: 'logout',
      table: 'auth.users',
      recordId: user.id,
      request,
    });
  }

  return NextResponse.json({ ok: true });
}
