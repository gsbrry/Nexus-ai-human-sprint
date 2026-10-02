import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrg, isResponse, jsonError, hasRole } from '@/lib/server/api';
import { colorForId, initialsFor } from '@/lib/board';
import { recordAudit } from '@/lib/server/audit';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['member', 'scrum_master', 'org_admin']).optional(),
  /** Soft-remove a member from the workspace. Profiles are never hard deleted. */
  remove: z.boolean().optional(),
});

/** GET /api/orgs/members — everyone in the caller's workspace. */
export async function GET() {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('org_members')
    .select('user_id, role, joined_at, profiles(id, full_name, email, avatar_url, timezone)')
    .eq('org_id', ctx.orgId)
    .is('deleted_at', null)
    .order('joined_at', { ascending: true });

  if (error) return jsonError(error.message, 400);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const members = (data ?? []).map((row: any) => {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const id = p?.id ?? row.user_id;
    const name = p?.full_name || p?.email || 'Pending member';
    return {
      id,
      name,
      email: p?.email ?? undefined,
      role: row.role,
      joined_at: row.joined_at,
      timezone: p?.timezone ?? null,
      color: colorForId(id),
      initials: initialsFor(p?.full_name || p?.email),
      is_you: id === ctx.userId,
    };
  });

  return NextResponse.json({ members, role: ctx.role });
}

/** PATCH /api/orgs/members — change a member's role, or remove them. Org admin and above. */
export async function PATCH(request: Request) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'org_admin')) {
    return jsonError('Only an org admin can manage members', 403);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { user_id, role, remove } = parsed.data;
  if (user_id === ctx.userId) {
    return jsonError('You cannot change your own membership here', 400);
  }

  const update = remove ? { deleted_at: new Date().toISOString() } : role ? { role } : null;
  if (!update) return jsonError('Nothing to update', 400);

  const { data, error } = await ctx.supabase
    .from('org_members')
    .update(update)
    .eq('org_id', ctx.orgId)
    .eq('user_id', user_id)
    .is('deleted_at', null)
    .select('user_id, role')
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Member not found in this workspace', 404);

  await recordAudit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: remove ? 'soft_delete' : 'permission_change',
    table: 'org_members',
    recordId: user_id,
    newData: remove ? null : { role },
    request,
  });

  return NextResponse.json({ ok: true, member: data });
}
