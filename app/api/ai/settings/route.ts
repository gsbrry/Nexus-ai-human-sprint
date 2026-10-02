import { NextResponse } from 'next/server';
import { requireOrg, isResponse, jsonError } from '@/lib/server/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/settings — which of the three AI modes are available to this user.
 * The Settings and Import screens read this to decide what to offer.
 */
export async function GET() {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const { data: hasKey } = await ctx.supabase.rpc('has_anthropic_key');
  const { data: integration } = await ctx.supabase
    .from('org_integrations_status')
    .select('has_telegram_bot_token')
    .eq('org_id', ctx.orgId)
    .maybeSingle();

  return NextResponse.json({
    modes: {
      // Mode 1 never needs configuration — it is the default and always on.
      manual_json: { available: true, active: !hasKey },
      api_connected: { available: Boolean(hasKey), active: Boolean(hasKey) },
      agent_tracking: {
        available: true,
        webhook: Boolean(integration?.has_telegram_bot_token),
        paste: true,
      },
    },
    has_anthropic_key: Boolean(hasKey),
  });
}
