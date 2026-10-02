/**
 * Server-only access to a workspace's bring-your-own Telegram bot.
 *
 * The token lives in org_integrations, which has RLS enabled and no policies, so
 * only the service-role client can reach it (migration 015).
 */
import 'server-only';
import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

export type TelegramConfig = {
  botToken: string;
  webhookSecret: string | null;
};

export async function getTelegramConfig(orgId: string): Promise<TelegramConfig | null> {
  const admin = createServiceClient();
  const { data } = await admin
    .from('org_integrations')
    .select('telegram_bot_token, telegram_webhook_secret')
    .eq('org_id', orgId)
    .maybeSingle();

  const row = data as { telegram_bot_token?: string | null; telegram_webhook_secret?: string | null } | null;
  if (!row?.telegram_bot_token?.trim()) return null;
  return { botToken: row.telegram_bot_token, webhookSecret: row.telegram_webhook_secret ?? null };
}

export async function saveTelegramBotToken(orgId: string, botToken: string, updatedBy: string) {
  const admin = createServiceClient();
  // A fresh secret per token, sent as X-Telegram-Bot-Api-Secret-Token and checked
  // on every webhook delivery — this is what blocks the replay case Nina tests.
  const webhookSecret = randomBytes(24).toString('hex');
  const { error } = await admin.from('org_integrations').upsert(
    {
      org_id: orgId,
      telegram_bot_token: botToken,
      telegram_webhook_secret: webhookSecret,
      updated_by: updatedBy,
    },
    { onConflict: 'org_id' }
  );
  if (error) throw new Error(error.message);
  return webhookSecret;
}

export async function clearTelegramBotToken(orgId: string, updatedBy: string) {
  const admin = createServiceClient();
  const { error } = await admin.from('org_integrations').upsert(
    {
      org_id: orgId,
      telegram_bot_token: null,
      telegram_webhook_secret: null,
      updated_by: updatedBy,
    },
    { onConflict: 'org_id' }
  );
  if (error) throw new Error(error.message);
}

/** Looks the bot up, which both validates the token and names it for the UI. */
export async function getBotIdentity(botToken: string): Promise<{ username: string; name: string }> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  const json = (await res.json().catch(() => null)) as
    | { ok?: boolean; description?: string; result?: { username?: string; first_name?: string } }
    | null;
  if (!res.ok || !json?.ok || !json.result) {
    throw new Error(json?.description ?? 'Telegram rejected that bot token');
  }
  return { username: json.result.username ?? 'unknown', name: json.result.first_name ?? 'Bot' };
}

export async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  const json = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!res.ok || !json?.ok) {
    throw new Error(json?.description ?? `Telegram returned ${res.status}`);
  }
  return true;
}

// ---------------------------------------------------------------------------
// Agent webhook key — the credential an external AI agent presents when it posts
// task updates. Lives alongside the other workspace secrets for the same reason:
// only service_role can read it.
// ---------------------------------------------------------------------------

export async function rotateAgentApiKey(orgId: string, updatedBy: string): Promise<string> {
  const admin = createServiceClient();
  const key = `nxs_agent_${randomBytes(24).toString('hex')}`;
  const { error } = await admin
    .from('org_integrations')
    .upsert({ org_id: orgId, agent_api_key: key, updated_by: updatedBy }, { onConflict: 'org_id' });
  if (error) throw new Error(error.message);
  return key;
}

export async function revokeAgentApiKey(orgId: string, updatedBy: string): Promise<void> {
  const admin = createServiceClient();
  const { error } = await admin
    .from('org_integrations')
    .upsert({ org_id: orgId, agent_api_key: null, updated_by: updatedBy }, { onConflict: 'org_id' });
  if (error) throw new Error(error.message);
}

/** Resolves an agent key to its org, or null. Used to authenticate the webhook. */
export async function orgForAgentApiKey(key: string): Promise<string | null> {
  if (!key || !key.startsWith('nxs_agent_')) return null;
  const admin = createServiceClient();
  const { data } = await admin
    .from('org_integrations')
    .select('org_id')
    .eq('agent_api_key', key)
    .maybeSingle();
  return (data as { org_id?: string } | null)?.org_id ?? null;
}
