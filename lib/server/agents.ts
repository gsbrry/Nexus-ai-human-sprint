/**
 * Server-only access to agent webhook credentials.
 *
 * `agents.api_key` is revoked from every client role (migration 017), so these
 * go through the service client. A key is returned to the caller exactly once,
 * at issue time, and never again.
 */
import 'server-only';
import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

export type AgentIdentity = { id: string; orgId: string; name: string; status: string };

export async function rotateAgentKey(agentId: string): Promise<string> {
  const admin = createServiceClient();
  const key = `nxs_agent_${randomBytes(24).toString('hex')}`;
  const { error } = await admin.from('agents').update({ api_key: key }).eq('id', agentId);
  if (error) throw new Error(error.message);
  return key;
}

export async function revokeAgentKey(agentId: string): Promise<void> {
  const admin = createServiceClient();
  const { error } = await admin.from('agents').update({ api_key: null }).eq('id', agentId);
  if (error) throw new Error(error.message);
}

/** Resolves a presented key to the agent it belongs to, or null. */
export async function agentForApiKey(key: string): Promise<AgentIdentity | null> {
  if (!key || !key.startsWith('nxs_agent_')) return null;
  const admin = createServiceClient();
  const { data } = await admin
    .from('agents')
    .select('id, org_id, name, status, deleted_at')
    .eq('api_key', key)
    .maybeSingle();

  const row = data as
    | { id: string; org_id: string; name: string; status: string; deleted_at: string | null }
    | null;
  if (!row || row.deleted_at) return null;
  return { id: row.id, orgId: row.org_id, name: row.name, status: row.status };
}

/** Whether an agent currently has a key issued, without revealing it. */
export async function agentHasKey(agentId: string): Promise<boolean> {
  const admin = createServiceClient();
  const { data } = await admin.from('agents').select('api_key').eq('id', agentId).maybeSingle();
  const key = (data as { api_key?: string | null } | null)?.api_key;
  return Boolean(key && key.trim());
}
