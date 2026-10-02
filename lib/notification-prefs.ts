/**
 * Notification preferences. Stored on `profiles.metadata.notifications`, so there
 * is no extra table and the defaults apply to every profile that has never saved.
 */
export type NotificationPrefs = {
  mentions_email: boolean;
  mentions_telegram: boolean;
  assigned_email: boolean;
  assigned_telegram: boolean;
  blocker_email: boolean;
  blocker_telegram: boolean;
  sprint_email: boolean;
  sprint_telegram: boolean;
  digest_email: boolean;
  digest_telegram: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  mentions_email: true,
  mentions_telegram: true,
  assigned_email: true,
  assigned_telegram: false,
  blocker_email: true,
  blocker_telegram: true,
  sprint_email: true,
  sprint_telegram: false,
  digest_email: true,
  digest_telegram: false,
};

export const NOTIFICATION_PREF_KEYS = Object.keys(
  DEFAULT_NOTIFICATION_PREFS
) as (keyof NotificationPrefs)[];

/** Rows rendered by the Notifications tab, in order. */
export const NOTIFICATION_ROWS: {
  label: string;
  desc: string;
  email: keyof NotificationPrefs;
  telegram: keyof NotificationPrefs;
}[] = [
  {
    label: 'Mentions',
    desc: 'You are @mentioned in a comment or task.',
    email: 'mentions_email',
    telegram: 'mentions_telegram',
  },
  {
    label: 'Assigned to me',
    desc: 'A task is assigned to you or its sprint changes.',
    email: 'assigned_email',
    telegram: 'assigned_telegram',
  },
  {
    label: 'Blockers raised',
    desc: 'Any task in your projects is flagged blocked.',
    email: 'blocker_email',
    telegram: 'blocker_telegram',
  },
  {
    label: 'Sprint events',
    desc: 'Sprint starts, closes, or hits a milestone.',
    email: 'sprint_email',
    telegram: 'sprint_telegram',
  },
  {
    label: 'Daily digest',
    desc: 'One round-up at 09:00 your local time.',
    email: 'digest_email',
    telegram: 'digest_telegram',
  },
];

/** Merges a stored (possibly partial, possibly stale) blob over the defaults. */
export function normalisePrefs(stored: unknown): NotificationPrefs {
  const out = { ...DEFAULT_NOTIFICATION_PREFS };
  if (stored && typeof stored === 'object') {
    for (const key of NOTIFICATION_PREF_KEYS) {
      const v = (stored as Record<string, unknown>)[key];
      if (typeof v === 'boolean') out[key] = v;
    }
  }
  return out;
}
