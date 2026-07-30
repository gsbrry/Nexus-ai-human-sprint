import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Role = 'member' | 'scrum_master' | 'org_admin' | 'super_admin';
const VALID_ROLES: Role[] = ['member', 'scrum_master', 'org_admin'];

/**
 * PATCH /api/org-members/[id]
 * Body: { role: 'member' | 'scrum_master' | 'org_admin' }
 * Row-level policy 'org_members_update_admin' enforces admin-only writes.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let body: { role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.role || !VALID_ROLES.includes(body.role as Role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('org_members')
    .update({ role: body.role })
    .eq('id', params.id)
    .select('id, role, user_id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ member: data });
}

/**
 * DELETE /api/org-members/[id]
 * Soft-delete membership. Uses `deleted_at` sentinel column.
 */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { error } = await supabase
    .from('org_members')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
