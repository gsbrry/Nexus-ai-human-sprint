import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ members: [] });
  }
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  // Confirm caller is a member of this org
  const { data: callerMembership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', params.id)
    .maybeSingle();
  if (!callerMembership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use service client to also pull profile names/emails (RLS-safe scope to this org
  // because we already verified membership above).
  const admin = createServiceClient();
  const { data: members } = await admin
    .from('org_members')
    .select('user_id, role, profiles(full_name, email, avatar_url)')
    .eq('org_id', params.id);

  const out = (members ?? []).map((m: { user_id: string; role: string; profiles: { full_name: string | null; email: string | null; avatar_url: string | null } | null }) => {
    const fullName = m.profiles?.full_name ?? '';
    const initials = (fullName.trim() || m.profiles?.email || '')
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s: string) => s[0]?.toUpperCase())
      .join('') || 'U';
    return {
      user_id: m.user_id,
      role: m.role,
      full_name: m.profiles?.full_name ?? null,
      email: m.profiles?.email ?? null,
      initials,
    };
  });

  return NextResponse.json({ members: out });
}
