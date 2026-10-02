/**
 * Notification fan-out: in-app row, then email and Telegram when the recipient's
 * preferences and the workspace configuration allow it.
 *
 * In-app is always written — it is the one channel that needs no setup. Email
 * needs RESEND_API_KEY; Telegram needs the workspace bot plus the recipient's
 * chat ID. A missing channel is skipped silently rather than failing the action
 * that triggered it: a comment must not fail because Telegram is down.
 */
import 'server-only';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail, isResendConfigured } from '@/lib/server/resend';
import { getTelegramConfig, sendTelegramMessage } from '@/lib/server/telegram';
import { normalisePrefs, type NotificationPrefs } from '@/lib/notification-prefs';

export type NotificationType =
  | 'task_assigned'
  | 'task_status_changed'
  | 'task_commented'
  | 'task_blocked'
  | 'task_due_soon'
  | 'sprint_started'
  | 'sprint_completed'
  | 'sprint_velocity_at_risk'
  | 'mention'
  | 'invite'
  | 'ai_agent_update';

/** Which preference pair governs each notification type. */
const PREF_FOR: Record<NotificationType, { email: keyof NotificationPrefs; telegram: keyof NotificationPrefs }> = {
  mention: { email: 'mentions_email', telegram: 'mentions_telegram' },
  ai_agent_update: { email: 'mentions_email', telegram: 'mentions_telegram' },
  task_commented: { email: 'mentions_email', telegram: 'mentions_telegram' },
  task_assigned: { email: 'assigned_email', telegram: 'assigned_telegram' },
  task_status_changed: { email: 'assigned_email', telegram: 'assigned_telegram' },
  task_due_soon: { email: 'assigned_email', telegram: 'assigned_telegram' },
  task_blocked: { email: 'blocker_email', telegram: 'blocker_telegram' },
  sprint_started: { email: 'sprint_email', telegram: 'sprint_telegram' },
  sprint_completed: { email: 'sprint_email', telegram: 'sprint_telegram' },
  sprint_velocity_at_risk: { email: 'sprint_email', telegram: 'sprint_telegram' },
  invite: { email: 'mentions_email', telegram: 'mentions_telegram' },
};

export type NotifyInput = {
  orgId: string;
  /** Recipients. The actor is filtered out, nobody is told about their own action. */
  userIds: string[];
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  taskId?: string | null;
  sprintId?: string | null;
};

function appUrl(path?: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  if (!path) return base || undefined;
  return base ? `${base}${path}` : path;
}

export async function emitNotification(input: NotifyInput): Promise<void> {
  const recipients = Array.from(new Set(input.userIds)).filter(
    (id) => id && id !== input.actorId
  );
  if (recipients.length === 0) return;

  const admin = createServiceClient();

  // 1. In-app rows. Client insert is revoked on notifications, so this is the
  //    only path that can write them.
  const { data: inserted, error } = await admin
    .from('notifications')
    .insert(
      recipients.map((userId) => ({
        org_id: input.orgId,
        user_id: userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
        task_id: input.taskId ?? null,
        sprint_id: input.sprintId ?? null,
      }))
    )
    .select('id, user_id');
  if (error) {
    console.error('[notify] in-app insert failed', error.message);
    return;
  }

  // Map recipient -> the row just written, so channel flags update the exact row.
  const rowFor = new Map<string, string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (inserted ?? []).map((r: any) => [r.user_id as string, r.id as string])
  );

  // 2. Email and Telegram, per recipient preference.
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, full_name, telegram_chat_id, metadata')
    .in('id', recipients);

  const telegram = await getTelegramConfig(input.orgId).catch(() => null);
  const prefKeys = PREF_FOR[input.type];
  const link = appUrl(input.link);

  await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profiles ?? []).map(async (p: any) => {
      const prefs = normalisePrefs(p.metadata?.notifications);

      if (prefs[prefKeys.email] && isResendConfigured() && p.email) {
        const result = await sendEmail({
          to: p.email,
          subject: input.title,
          text: [input.body, link].filter(Boolean).join('\n\n'),
          html: emailHtml(input.title, input.body, link),
        });
        const rowId = rowFor.get(p.id);
        if (!result.error && rowId) {
          await admin.from('notifications').update({ sent_via_email: true }).eq('id', rowId);
        }
      }

      if (prefs[prefKeys.telegram] && telegram && p.telegram_chat_id) {
        try {
          await sendTelegramMessage(
            telegram.botToken,
            p.telegram_chat_id,
            [`<b>${escapeHtml(input.title)}</b>`, input.body ? escapeHtml(input.body) : '', link ?? '']
              .filter(Boolean)
              .join('\n')
          );
          const rowId = rowFor.get(p.id);
          if (rowId) {
            await admin.from('notifications').update({ sent_via_telegram: true }).eq('id', rowId);
          }
        } catch (e) {
          console.error('[notify] telegram send failed', e instanceof Error ? e.message : e);
        }
      }
    })
  );
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function emailHtml(title: string, body?: string, link?: string) {
  return `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#111111;padding:32px;color:#F4F4F2">
  <div style="max-width:560px;margin:0 auto;background:#1F1F1F;border:1px solid #2A2A2A;border-radius:12px;padding:28px">
    <div style="font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#1a73e8">Nexus</div>
    <h1 style="font-size:18px;margin:12px 0 8px">${escapeHtml(title)}</h1>
    ${body ? `<p style="font-size:14px;line-height:1.6;color:#AAAAAA;margin:0 0 20px">${escapeHtml(body)}</p>` : ''}
    ${
      link
        ? `<a href="${link}" style="display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600">Open in Nexus</a>`
        : ''
    }
  </div>
</div>`;
}
