import { NextResponse } from 'next/server';
import { requireOrg, isResponse, jsonError } from '@/lib/server/api';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/comments/[id] — soft delete only (hard deletes are revoked in RLS).
 * The author, or any scrum master and above, may remove a comment.
 */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!data) return jsonError('Comment not found, or you cannot remove it', 404);

  return NextResponse.json({ ok: true, id: data.id });
}
