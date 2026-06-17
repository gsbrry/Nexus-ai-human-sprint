/**
 * NEXUS invite email template — dark/light aware HTML + plain-text fallback.
 */
export interface InviteEmailContext {
  inviteeEmail: string;
  workspaceName: string;
  inviterName: string;
  magicLinkUrl: string;
  role: string;
}

export interface InviteEmailPayload {
  subject: string;
  html: string;
  text: string;
}

export function buildInviteEmail(ctx: InviteEmailContext): InviteEmailPayload {
  const subject = `You’re invited to ${ctx.workspaceName} on NEXUS`;

  const text = [
    `Hi ${ctx.inviteeEmail.split('@')[0]},`,
    ``,
    `${ctx.inviterName} has invited you to join "${ctx.workspaceName}" on NEXUS as a ${ctx.role}.`,
    ``,
    `Accept your invitation:`,
    ctx.magicLinkUrl,
    ``,
    `This link expires in 7 days. If you didn’t expect this, you can safely ignore it.`,
    ``,
    `— The NEXUS team`,
  ].join('\n');

  const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="dark light" />
<title>${subject}</title>
<style>
:root { color-scheme: dark light; }
body { margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; color: #ffffff; }
.wrap { max-width: 560px; margin: 0 auto; padding: 32px 24px; }
.card { background: #111; border: 1px solid #2a2a2a; border-radius: 16px; padding: 32px; }
.logo { font-family: 'DM Mono', ui-monospace, monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #1a73e8; font-weight: 700; }
h1 { margin: 12px 0 8px; font-size: 28px; line-height: 1.2; font-weight: 800; letter-spacing: -0.01em; color: #fff; }
p { margin: 12px 0; font-size: 14px; line-height: 1.6; color: #ccc; }
.role { display: inline-block; padding: 4px 10px; border-radius: 6px; background: rgba(26,115,232,0.12); border: 1px solid rgba(26,115,232,0.3); color: #4a90e8; font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; }
.cta { display: inline-block; margin: 20px 0 8px; padding: 14px 28px; border-radius: 10px; background: #1a73e8; color: #fff !important; text-decoration: none; font-weight: 600; font-size: 14px; }
.url { word-break: break-all; font-family: 'DM Mono', monospace; font-size: 11px; color: #888; }
.foot { margin-top: 32px; padding-top: 20px; border-top: 1px solid #2a2a2a; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #555; }
@media (prefers-color-scheme: light) {
  body { background: #f5f5f4; color: #111; }
  .card { background: #fff; border-color: #e5e5e5; }
  h1 { color: #111; }
  p { color: #444; }
  .url { color: #777; }
  .foot { color: #888; border-top-color: #e5e5e5; }
}
</style>
</head><body>
<div class="wrap">
<div class="card">
<div class="logo">NEXUS · Invitation</div>
<h1>You’re invited.</h1>
<p><strong>${ctx.inviterName}</strong> has invited you to join <strong>${ctx.workspaceName}</strong> as a <span class="role">${ctx.role}</span>.</p>
<p>NEXUS is the AI-era project management workspace where human teams and AI agents collaborate on sprints together.</p>
<a href="${ctx.magicLinkUrl}" class="cta">Accept invitation</a>
<p style="margin-top:24px">Or paste this link into your browser:</p>
<p class="url">${ctx.magicLinkUrl}</p>
<div class="foot">This invitation expires in 7 days · Didn’t expect this? Safely ignore.</div>
</div>
</div>
</body></html>`;

  return { subject, html, text };
}
