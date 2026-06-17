/**
 * Server-only Resend client + send helper. Returns 503 if RESEND_API_KEY is missing.
 */
import 'server-only';
import { Resend } from 'resend';

const KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
const FROM_NAME = process.env.RESEND_FROM_NAME ?? 'NEXUS';

let client: Resend | null = null;
function getClient(): Resend | null {
  if (!KEY) return null;
  if (!client) client = new Resend(KEY);
  return client;
}

export function isResendConfigured(): boolean {
  return Boolean(KEY);
}

export async function sendEmail(args: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}): Promise<{ id?: string; error?: string }> {
  const c = getClient();
  if (!c) return { error: 'RESEND_API_KEY not configured' };
  const from = `${FROM_NAME} <${FROM_EMAIL}>`;
  try {
    const { data, error } = await c.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html ?? '',
      text: args.text ?? '',
    });
    if (error) return { error: error.message ?? 'Resend error' };
    return { id: data?.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown send error' };
  }
}
