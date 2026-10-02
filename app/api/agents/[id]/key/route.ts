import { NextResponse } from 'next/server';
import { requireOrg, isResponse, jsonError, hasRole } from '@/lib/server/api';
import { recordAudit } from '@/lib/server/audit';
import { agentHasKey, revokeAgentKey, rotateAgentKey } from '@/lib/server/agents';

export const dynamic = 'force-dynamic';

/** Confirms the agent belongs to the caller's workspace before touching its key. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertOwned(supabase: any, orgId: string, agentId: string) {
  const { data } = await supabase
    .from('agents')
    .select('id, name')
    .eq('id', agentId)
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .maybeSingle();
  return data as { id: string; name: string } | null;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const agent = await assertOwned(ctx.supabase, ctx.orgId, params.id);
  if (!agent) return jsonError('Agent not found', 404);

  return NextResponse.json({ has_key: await agentHasKey(agent.id) });
}

/** PUT — issue or rotate. The only response that ever contains the key. */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'scrum_master')) {
    return jsonError('Only a scrum master or admin can issue an agent key', 403);
  }

  const agent = await assertOwned(ctx.supabase, ctx.orgId, params.id);
  if (!agent) return jsonError('Agent not found', 404);

  try {
    const key = await rotateAgentKey(agent.id);
    await recordAudit({
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: 'update',
      table: 'agents',
      recordId: agent.id,
      metadata: { field: 'api_key', operation: 'issued', agent: agent.name },
      request,
    });
    return NextResponse.json({ ok: true, api_key: key, shown_once: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Could not issue a key', 400);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'scrum_master')) {
    return jsonError('Only a scrum master or admin can revoke an agent key', 403);
  }

  const agent = await assertOwned(ctx.supabase, ctx.orgId, params.id);
  if (!agent) return jsonError('Agent not found', 404);

  try {
    await revokeAgentKey(agent.id);
    await recordAudit({
      orgId: ctx.orgId,
      actorId: ctx.userId,
      action: 'update',
      table: 'agents',
      recordId: agent.id,
      metadata: { field: 'api_key', operation: 'revoked', agent: agent.name },
      request,
    });
    return NextResponse.json({ ok: true, has_key: false });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Could not revoke the key', 400);
  }
}
