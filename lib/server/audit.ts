/**
 * Audit trail writer.
 *
 * `audit_log` has `insert with check (false)` for every client role, and UPDATE
 * and DELETE are revoked from all roles including service_role (migration 013).
 * So rows can only be appended here, through the service client, and nothing in
 * the system can ever alter one afterwards.
 *
 * Auditing must never break the action it is recording: every failure is logged
 * to the server console and swallowed.
 */
import 'server-only';
import { createServiceClient } from '@/lib/supabase/server';

export type AuditAction =
  | 'insert'
  | 'update'
  | 'soft_delete'
  | 'restore'
  | 'login'
  | 'logout'
  | 'permission_change';

export type AuditEntry = {
  orgId?: string | null;
  actorId?: string | null;
  action: AuditAction;
  /** The table the change landed in, e.g. 'tasks'. */
  table: string;
  recordId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  /** Pass the incoming Request to capture IP and user agent. */
  request?: Request;
};

/** Field names whose values must never reach the audit trail. */
const REDACTED = [
  'anthropic_api_key',
  'telegram_bot_token',
  'telegram_webhook_secret',
  'agent_api_key',
  'api_key',
  'password',
  'service_role_key',
];

/**
 * Replaces secret values with a marker, keeping the field name so the trail still
 * shows that a key changed, just never what it changed to.
 */
function redact(data: Record<string, unknown> | null | undefined) {
  if (!data) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = REDACTED.includes(k) ? '[redacted]' : v;
  }
  return out;
}

function clientIp(request?: Request): string | null {
  if (!request) return null;
  // Vercel sets x-forwarded-for; take the first hop, which is the client.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim() || null;
  return request.headers.get('x-real-ip');
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const admin = createServiceClient();
    const { error } = await admin.from('audit_log').insert({
      org_id: entry.orgId ?? null,
      actor_id: entry.actorId ?? null,
      action: entry.action,
      table_name: entry.table,
      record_id: entry.recordId ?? null,
      old_data: redact(entry.oldData),
      new_data: redact(entry.newData),
      ip_address: clientIp(entry.request),
      user_agent: entry.request?.headers.get('user-agent') ?? null,
      metadata: entry.metadata ?? {},
    });
    if (error) console.error('[audit] insert failed', error.message);
  } catch (e) {
    console.error('[audit] insert threw', e instanceof Error ? e.message : e);
  }
}
