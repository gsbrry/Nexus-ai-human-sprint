/**
 * Shared guards for /app/api route handlers.
 *
 * Every route goes through `requireUser` (or `requireOrg` when the work is
 * org-scoped) so the auth-not-configured, not-signed-in and no-workspace cases
 * return one consistent shape instead of each route inventing its own.
 */
import 'server-only';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';

export type OrgRole = 'member' | 'scrum_master' | 'org_admin' | 'super_admin';

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export type AuthedContext = {
  // The generated Database types aren't in the repo yet (see types/database.ts),
  // so the client stays permissive rather than narrowing every table to `never`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  userId: string;
  email: string | null;
};

/** Resolves the signed-in user, or returns the response the route should send. */
export async function requireUser(): Promise<AuthedContext | NextResponse> {
  if (!isAuthConfigured()) {
    return jsonError(
      'Auth not configured. Add Supabase keys to .env.local then restart the server.',
      503
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError('Not signed in', 401);
  return { supabase, userId: user.id, email: user.email ?? null };
}

export type OrgContext = AuthedContext & { orgId: string; role: OrgRole };

/** Resolves the signed-in user plus their active org membership. */
export async function requireOrg(): Promise<OrgContext | NextResponse> {
  const ctx = await requireUser();
  if (ctx instanceof NextResponse) return ctx;

  const { data, error } = await ctx.supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', ctx.userId)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('No workspace yet. Visit /setup to create one.', 409);

  return { ...ctx, orgId: data.org_id as string, role: data.role as OrgRole };
}

const RANK: Record<OrgRole, number> = {
  member: 0,
  scrum_master: 1,
  org_admin: 2,
  super_admin: 3,
};

export function hasRole(role: OrgRole, min: OrgRole): boolean {
  return RANK[role] >= RANK[min];
}

/** True when the value is the early-return response rather than a context. */
export function isResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse;
}
