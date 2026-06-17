// Mock notification feed used by N-01 Notification centre. Strictly client-side.

export type MockNotifKind = 'mention' | 'ai' | 'system' | 'assigned' | 'blocker' | 'sprint';

export type MockNotification = {
  id: string;
  kind: MockNotifKind;
  title: string;
  body: string;
  task_key?: string;
  href?: string;
  actor_name: string;
  actor_initials: string;
  actor_color?: string;
  created_at: string; // ISO
  read: boolean;
};

// Anchored to the GBM demo "now" so groupings render predictably.
const NOW = new Date('2025-06-11T16:30:00Z');

function minutesAgo(m: number) {
  return new Date(NOW.getTime() - m * 60 * 1000).toISOString();
}
function hoursAgo(h: number) {
  return minutesAgo(h * 60);
}
function daysAgo(d: number) {
  return hoursAgo(d * 24);
}

export const mockNotifications: MockNotification[] = [
  {
    id: 'n-1',
    kind: 'mention',
    title: 'Marcus mentioned you on GBM-143',
    body: '@Raphy heads-up — if data eng is still blocking at EOD I will escalate.',
    task_key: 'GBM-143',
    href: '/sprints/s-gbm-14',
    actor_name: 'Marcus Alden',
    actor_initials: 'MA',
    actor_color: '#7AA7E0',
    created_at: minutesAgo(8),
    read: false,
  },
  {
    id: 'n-2',
    kind: 'ai',
    title: 'Aria · RAG Agent posted on GBM-148',
    body: '14/47 sources flagged as non-peer-reviewed. Draft replacements attached.',
    task_key: 'GBM-148',
    href: '/sprints/s-gbm-14',
    actor_name: 'Aria · RAG Agent',
    actor_initials: 'AI',
    actor_color: '#9C7DD6',
    created_at: minutesAgo(22),
    read: false,
  },
  {
    id: 'n-3',
    kind: 'assigned',
    title: 'Layla assigned NEX-24 to you',
    body: 'T-03 slide-in task detail panel · due 11 Jun.',
    task_key: 'NEX-24',
    href: '/sprints/s-nex-2',
    actor_name: 'Layla Park',
    actor_initials: 'LK',
    actor_color: '#4a90e8',
    created_at: minutesAgo(48),
    read: false,
  },
  {
    id: 'n-4',
    kind: 'blocker',
    title: 'Blocker raised on GBM-143',
    body: 'Waiting on data eng to produce cohort 04 anonymised export.',
    task_key: 'GBM-143',
    href: '/sprints/s-gbm-14',
    actor_name: 'Marcus Alden',
    actor_initials: 'MA',
    actor_color: '#7AA7E0',
    created_at: hoursAgo(2),
    read: false,
  },
  {
    id: 'n-5',
    kind: 'sprint',
    title: 'Sprint #2 · NEX is 50% complete',
    body: '8 of 16 points done, 2 open. Burndown is tracking the ideal line.',
    href: '/sprints/s-nex-2',
    actor_name: 'Nexus system',
    actor_initials: 'NX',
    actor_color: '#7DC8B8',
    created_at: hoursAgo(4),
    read: true,
  },
  {
    id: 'n-6',
    kind: 'system',
    title: 'Anay completed GBM-147',
    body: 'Capstone proctor heartbeat · reconnect logic.',
    task_key: 'GBM-147',
    href: '/sprints/s-gbm-14',
    actor_name: 'Anay Roy',
    actor_initials: 'AN',
    actor_color: '#F09595',
    created_at: hoursAgo(7),
    read: true,
  },
  {
    id: 'n-7',
    kind: 'mention',
    title: 'Shreya mentioned you on the cohort 05 drip',
    body: '@Raphy can you sign off on the 7-email drip drafts by Friday?',
    task_key: 'GBM-160',
    href: '/sprints/backlog',
    actor_name: 'Shreya Patel',
    actor_initials: 'SP',
    actor_color: '#D8B26E',
    created_at: daysAgo(1) + '',
    read: true,
  },
  {
    id: 'n-8',
    kind: 'ai',
    title: 'Aria · RAG Agent drafted GBM-161 axes',
    body: 'Recommending Cohen’s kappa over raw % agreement. Drafted axis definitions attached.',
    task_key: 'GBM-161',
    href: '/sprints/backlog',
    actor_name: 'Aria · RAG Agent',
    actor_initials: 'AI',
    actor_color: '#9C7DD6',
    created_at: daysAgo(1),
    read: true,
  },
  {
    id: 'n-9',
    kind: 'system',
    title: 'New member joined the NEXUS workspace',
    body: 'Nina Torres accepted the invite and joined as scrum_master.',
    href: '/settings',
    actor_name: 'Nexus system',
    actor_initials: 'NX',
    actor_color: '#7DC8B8',
    created_at: daysAgo(2),
    read: true,
  },
  {
    id: 'n-10',
    kind: 'sprint',
    title: 'Sprint #14 · GBM closed',
    body: '32 points completed of 40 committed. Carry over: 8 pts to Sprint #15.',
    href: '/velocity',
    actor_name: 'Nexus system',
    actor_initials: 'NX',
    actor_color: '#7DC8B8',
    created_at: daysAgo(3),
    read: true,
  },
];

export function groupNotifications(items: MockNotification[]) {
  const today: MockNotification[] = [];
  const earlier: MockNotification[] = [];
  const cutoff = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()).getTime();
  for (const n of items) {
    const t = new Date(n.created_at).getTime();
    if (t >= cutoff) today.push(n);
    else earlier.push(n);
  }
  return { today, earlier };
}
