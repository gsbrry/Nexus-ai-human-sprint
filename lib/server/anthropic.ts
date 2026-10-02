/**
 * Server-only access to a user's bring-your-own Anthropic key.
 *
 * The key column is revoked from every client role (migration 014), so reading it
 * requires the service-role client. Nothing here returns the key to a caller: it
 * is read, used for one outbound request, and discarded.
 */
import 'server-only';
import { createServiceClient } from '@/lib/supabase/server';

/** Latest and most capable model — see the Claude model list before changing. */
export const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-5';

export async function getUserAnthropicKey(userId: string): Promise<string | null> {
  const admin = createServiceClient();
  const { data } = await admin
    .from('profiles')
    .select('anthropic_api_key')
    .eq('id', userId)
    .maybeSingle();
  const key = (data as { anthropic_api_key?: string | null } | null)?.anthropic_api_key;
  return key && key.trim() ? key : null;
}

export type ClaudeResult = { text: string; inputTokens: number; outputTokens: number; model: string };

/** Single-turn call to the Messages API using the caller's own key. */
export async function callClaude(opts: {
  apiKey: string;
  system?: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}): Promise<ClaudeResult> {
  const model = opts.model ?? DEFAULT_CLAUDE_MODEL;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 8000,
      ...(opts.system ? { system: opts.system } : {}),
      messages: [{ role: 'user', content: opts.prompt }],
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (json as { error?: { message?: string } } | null)?.error?.message ??
      `Claude API returned ${res.status}`;
    throw new Error(message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = json as any;
  const text: string = (payload.content ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((b: any) => b.type === 'text')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((b: any) => b.text)
    .join('')
    .trim();

  return {
    text,
    inputTokens: payload.usage?.input_tokens ?? 0,
    outputTokens: payload.usage?.output_tokens ?? 0,
    model: payload.model ?? model,
  };
}
