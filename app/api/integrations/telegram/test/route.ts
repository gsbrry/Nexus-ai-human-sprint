import { NextResponse } from 'next/server';
import { requireOrg, isResponse, jsonError } from '@/lib/server/api';
import { getTelegramConfig, sendTelegramMessage } from '@/lib/server/telegram';

export const dynamic = 'force-dynamic';

/**
 * POST — send a test message to the caller's own Telegram chat, so a user can
 * confirm their chat ID before relying on task notifications.
 */
export async function POST() {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const config = await getTelegramConfig(ctx.orgId);
  if (!config) {
    return jsonError('No Telegram bot connected for this workspace yet', 409);
  }

  const { data: profile, error } = await ctx.supabase
    .from('profiles')
    .select('telegram_chat_id, full_name')
    .eq('id', ctx.userId)
    .maybeSingle();

  if (error) return jsonError(error.message, 400);
  if (!profile?.telegram_chat_id) {
    return jsonError('Add your Telegram chat ID first, then send a test', 409);
  }

  try {
    await sendTelegramMessage(
      config.botToken,
      profile.telegram_chat_id,
      `<b>Nexus</b>\nTelegram is connected. You will get task and sprint alerts here.`
    );
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Telegram rejected the message', 400);
  }

  return NextResponse.json({ ok: true });
}
