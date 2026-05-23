import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';

const schema = z
  .object({
    full_name: z.string().min(2).max(80),
    org_action: z.enum(['create', 'join']),
    org_name: z.string().min(2).max(80).optional(),
    invite_code: z.string().min(1).max(40).optional(),
  })
  .refine((d) => (d.org_action === 'create' ? !!d.org_name : true), {
    path: ['org_name'],
    message: 'Organisation name required',
  })
  .refine((d) => (d.org_action === 'join' ? !!d.invite_code : true), {
    path: ['invite_code'],
    message: 'Invite code required',
  });

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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  // Cast: Database column types arrive when we run `supabase gen types` after migrations.
  // Until then we use the runtime client without strict generics for write paths.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { full_name, org_action, org_name, invite_code } = parsed.data;

  // Update profile name
  const profileUpdate = await supabase.from('profiles').update({ full_name }).eq('id', user.id);
  if (profileUpdate.error) {
    return NextResponse.json({ error: profileUpdate.error.message }, { status: 400 });
  }

  if (org_action === 'create' && org_name) {
    const slug =
      org_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 40) || `org-${user.id.slice(0, 8)}`;

    const { data: org, error: orgErr } = await supabase
      .from('organisations')
      .insert({ name: org_name, slug, created_by: user.id })
      .select()
      .single();
    if (orgErr || !org) {
      return NextResponse.json({ error: orgErr?.message ?? 'Could not create organisation' }, { status: 400 });
    }

    const { error: memberErr } = await supabase
      .from('org_members')
      .insert({ org_id: org.id, user_id: user.id, role: 'org_admin' });
    if (memberErr) {
      return NextResponse.json({ error: memberErr.message }, { status: 400 });
    }
  } else if (org_action === 'join' && invite_code) {
    // Invite code resolution lands with the invite flow in Sprint 4.
    // For now, return a clear message so the API contract is honest.
    return NextResponse.json(
      { error: 'Invite-code join arrives in Sprint 4 (N-04 invite flow).' },
      { status: 501 }
    );
  }

  return NextResponse.json({ ok: true });
}
