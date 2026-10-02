import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { jsonError } from '@/lib/server/api';
import { sendTelegramMessage } from '@/lib/server/telegram';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/telegram-webhook?org=<org_id>
 *
 * Inbound updates from a workspace's Telegram bot. Two protections, both of
 * which Nina tests at the Sprint 4 gate:
 *
 *   1. The X-Telegram-Bot-Api-Secret-Token header must match the secret stored
 *      when the bot was connected. Telegram sends it on every delivery, so a
 *      replayed or forged request without it is rejected before any work.
 *   2. update_id is recorded per org, so a replay of a genuine, previously seen
 *      update is dropped rather than re-processed.
 *
 * The one command it answers is /start, which tells the user their chat ID so
 * they can paste it into Settings.
 */
export async function POST(request: Request) {
  if (!isAuthConfigured()) return jsonError('Auth not configured on this deployment', 503);

  const orgId = new URL(request.url).searchParams.get('org');
  if (!orgId) return jsonError('Missing org', 400);

  const admin = createServiceClient();
  const { data: integration } = await admin
    .from('org_integrations')
    .select('telegram_bot_token, telegram_webhook_secret')
    .eq('org_id', orgId)
    .maybeSingle();

  const row = integration as
    | { telegram_bot_token?: string | null; telegram_webhook_secret?: string | null }
    | null;

  if (!row?.telegram_bot_token || !row.telegram_webhook_secret) {
    return jsonError('No Telegram bot connected for this workspace', 404);
  }

  const presented = request.headers.get('x-telegram-bot-api-secret-token') ?? '';
  if (presented !== row.telegram_webhook_secret) {
    // Deliberately vague: a probe learns nothing about which half was wrong.
    return jsonError('Unauthorised', 401);
  }

  let update: {
    update_id?: number;
    message?: { chat?: { id?: number }; text?: string; from?: { first_name?: string } };
  };
  try {
    update = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  // Replay guard. Telegram retries legitimately, so a repeat is a no-op, not an error.
  if (typeof update.update_id === 'number') {
    const { error } = await admin.from('telegram_updates').insert({
      org_id: orgId,
      update_id: update.update_id,
    });
    // 23505 means we have already handled this update_id for this org.
    if (error && (error as { code?: string }).code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true });
    }
  }

  const chatId = update.message?.chat?.id;
  const text = (update.message?.text ?? '').trim();

  if (chatId && text.startsWith('/start')) {
    try {
      await sendTelegramMessage(
        row.telegram_bot_token,
        String(chatId),
        `<b>Nexus</b>\nYour chat ID is <code>${chatId}</code>.\nPaste it into Settings → Profile to get task alerts here.`
      );
    } catch {
      // A failed reply must not make Telegram retry the whole update.
    }
  }

  return NextResponse.json({ ok: true });
}
