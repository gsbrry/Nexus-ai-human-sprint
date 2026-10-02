import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrg, isResponse, jsonError, hasRole } from '@/lib/server/api';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug may use lowercase letters, numbers and hyphens only')
    .optional(),
  logo_url: z.string().url().max(500).nullable().optional(),
});

/** GET /api/orgs/current — the caller's active workspace plus their role in it. */
export async function GET() {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('organisations')
    .select('id, name, slug, logo_url, settings, created_at')
    .eq('id', ctx.orgId)
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Workspace not found', 404);

  return NextResponse.json({ org: data, role: ctx.role });
}

/** PATCH /api/orgs/current — rename or rebrand the workspace. Org admin and above. */
export async function PATCH(request: Request) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'org_admin')) {
    return jsonError('Only an org admin can change workspace settings', 403);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  if (Object.keys(parsed.data).length === 0) return jsonError('Nothing to update', 400);

  const { data, error } = await ctx.supabase
    .from('organisations')
    .update(parsed.data)
    .eq('id', ctx.orgId)
    .select('id, name, slug, logo_url')
    .maybeSingle();

  if (error) {
    // 23505 is the unique violation on organisations.slug.
    const message = error.code === '23505' ? 'That slug is already taken' : error.message;
    return jsonError(message, 400);
  }

  return NextResponse.json({ org: data });
}
