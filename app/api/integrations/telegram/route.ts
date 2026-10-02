import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrg, isResponse, jsonError, hasRole } from '@/lib/server/api';
import {
  clearTelegramBotToken,
  getBotIdentity,
  saveTelegramBotToken,
} from '@/lib/server/telegram';

export const dynamic = 'force-dynamic';

const putSchema = z.object({
  bot_token: z
    .string()
    .trim()
    .regex(/^\d{6,}:[A-Za-z0-9_-]{30,}$/, 'That does not look like a @BotFather token'),
});

/** GET — whether this workspace has a bot configured. Never returns the token. */
export async function GET() {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('org_integrations_status')
    .select('has_telegram_bot_token, updated_at')
    .eq('org_id', ctx.orgId)
    .maybeSingle();

  if (error) return jsonError(error.message, 400);

  return NextResponse.json({
    has_telegram_bot_token: Boolean(data?.has_telegram_bot_token),
    updated_at: data?.updated_at ?? null,
  });
}

/** PUT — save a @BotFather token for this workspace. Org admin and above. */
export async function PUT(request: Request) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'org_admin')) {
    return jsonError('Only an org admin can change workspace integrations', 403);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = putSchema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid token', 400);

  let identity: { username: string; name: string };
  try {
    identity = await getBotIdentity(parsed.data.bot_token);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Telegram rejected that bot token', 400);
  }

  try {
    await saveTelegramBotToken(ctx.orgId, parsed.data.bot_token, ctx.userId);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Could not save the bot token', 400);
  }

  return NextResponse.json({ ok: true, has_telegram_bot_token: true, bot: identity });
}

/** DELETE — disconnect the workspace bot. */
export async function DELETE() {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;
  if (!hasRole(ctx.role, 'org_admin')) {
    return jsonError('Only an org admin can change workspace integrations', 403);
  }

  try {
    await clearTelegramBotToken(ctx.orgId, ctx.userId);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Could not clear the bot token', 400);
  }

  return NextResponse.json({ ok: true, has_telegram_bot_token: false });
}
