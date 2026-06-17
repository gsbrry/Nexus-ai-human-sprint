import { NextResponse } from 'next/server';
import { isResendConfigured, sendEmail } from '@/lib/server/resend';

/**
 * Generic send endpoint. Accepts { to, subject, html?, text? }.
 * Returns 503 if Resend is not configured so the UI can fall back to mocks.
 */
export async function POST(req: Request) {
  if (!isResendConfigured()) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 503 });
  }

  let body: { to?: string | string[]; subject?: string; html?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.to || !body.subject || (!body.html && !body.text)) {
    return NextResponse.json(
      { error: 'Missing required fields: to, subject, and either html or text' },
      { status: 400 }
    );
  }

  const result = await sendEmail({
    to: body.to,
    subject: body.subject,
    html: body.html,
    text: body.text,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ id: result.id });
}
