import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isResendConfigured, sendEmail } from '@/lib/server/resend';
import { buildInviteEmail } from '@/lib/server/email-templates';

/**
 * Send a real invite email via Resend.
 *
 * Accepts: { emails: string[], role: 'member' | 'scrum_master' | 'org_admin', workspaceName? }
 * Requires authenticated user (real Supabase session OR demo mode for testing).
 *
 * Returns 503 if Resend not configured → caller falls back to mock UI.
 */
export async function POST(req: Request) {
  if (!isResendConfigured()) {
    return NextResponse.json({ error: 'Resend not configured', sent: [] }, { status: 503 });
  }

  let body: { emails?: string[]; role?: string; workspaceName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const emails = Array.isArray(body.emails) ? body.emails.filter(Boolean) : [];
  if (emails.length === 0) {
    return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
  }
  if (emails.length > 25) {
    return NextResponse.json({ error: 'Maximum 25 invites per request' }, { status: 400 });
  }

  const role = body.role ?? 'member';
  const workspaceName = body.workspaceName ?? 'NEXUS Studio';

  // Try to identify the inviter
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let inviterName = 'A teammate';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();
    inviterName = profile?.full_name ?? user.email ?? 'A teammate';
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexus.dev';

  const results = await Promise.all(
    emails.map(async (email) => {
      const token = crypto.randomUUID();
      const magicLinkUrl = `${baseUrl}/invite?token=${token}`;
      const { subject, html, text } = buildInviteEmail({
        inviteeEmail: email,
        workspaceName,
        inviterName,
        magicLinkUrl,
        role: role.replace('_', ' '),
      });
      const r = await sendEmail({ to: email, subject, html, text });
      return { email, ...r };
    })
  );

  const sent = results.filter((r) => !r.error).map((r) => r.email);
  const failed = results.filter((r) => r.error);

  return NextResponse.json({ sent, failed, total: emails.length });
}
