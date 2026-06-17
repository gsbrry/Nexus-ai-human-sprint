// Super-admin mock data — used by SA-01 (orgs list) and SA-02 (platform metrics).
// Anchored to the GBM demo "now": 2025-06-11T16:30:00Z.

export type Plan = 'starter' | 'team' | 'business' | 'enterprise';
export type OrgStatus = 'active' | 'trial' | 'past_due' | 'churned';

export type MockOrg = {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  status: OrgStatus;
  members: number;
  projects: number;
  active_sprints: number;
  monthly_recurring_revenue: number; // USD
  ai_tokens_30d: number;
  storage_gb: number;
  health: number; // 0-100 composite
  created_at: string;
  owner_name: string;
  owner_initials: string;
  owner_color: string;
  region: 'eu' | 'us' | 'apac';
};

export const PLAN_PRICE: Record<Plan, number> = {
  starter: 0,
  team: 49,
  business: 199,
  enterprise: 899,
};

export const PLAN_LABEL: Record<Plan, string> = {
  starter: 'Starter',
  team: 'Team',
  business: 'Business',
  enterprise: 'Enterprise',
};

export const STATUS_LABEL: Record<OrgStatus, string> = {
  active: 'Active',
  trial: 'Trial',
  past_due: 'Past due',
  churned: 'Churned',
};

export const mockOrgs: MockOrg[] = [
  {
    id: 'org-gbm',
    name: 'GBM AI Academy',
    slug: 'gbm',
    plan: 'enterprise',
    status: 'active',
    members: 42,
    projects: 6,
    active_sprints: 3,
    monthly_recurring_revenue: 1799,
    ai_tokens_30d: 14_200_000,
    storage_gb: 87.4,
    health: 96,
    created_at: '2024-09-04T10:00:00Z',
    owner_name: 'Raphy Varghese',
    owner_initials: 'RV',
    owner_color: '#1a73e8',
    region: 'eu',
  },
  {
    id: 'org-nexus',
    name: 'NEXUS Studio',
    slug: 'nexus',
    plan: 'business',
    status: 'active',
    members: 8,
    projects: 2,
    active_sprints: 1,
    monthly_recurring_revenue: 199,
    ai_tokens_30d: 1_840_000,
    storage_gb: 9.2,
    health: 92,
    created_at: '2025-04-19T09:30:00Z',
    owner_name: 'Raphy Varghese',
    owner_initials: 'RV',
    owner_color: '#1a73e8',
    region: 'eu',
  },
  {
    id: 'org-mercury',
    name: 'Mercury Robotics',
    slug: 'mercury',
    plan: 'business',
    status: 'active',
    members: 24,
    projects: 4,
    active_sprints: 2,
    monthly_recurring_revenue: 199,
    ai_tokens_30d: 4_320_000,
    storage_gb: 31.7,
    health: 88,
    created_at: '2024-11-12T14:15:00Z',
    owner_name: 'Sofia Marquez',
    owner_initials: 'SM',
    owner_color: '#7DC8B8',
    region: 'us',
  },
  {
    id: 'org-koala',
    name: 'Koala Health',
    slug: 'koala-health',
    plan: 'team',
    status: 'active',
    members: 11,
    projects: 2,
    active_sprints: 1,
    monthly_recurring_revenue: 49,
    ai_tokens_30d: 980_000,
    storage_gb: 4.1,
    health: 81,
    created_at: '2025-02-08T08:20:00Z',
    owner_name: 'Jin Park',
    owner_initials: 'JP',
    owner_color: '#7AA7E0',
    region: 'apac',
  },
  {
    id: 'org-foundry',
    name: 'Foundry Labs',
    slug: 'foundry',
    plan: 'enterprise',
    status: 'active',
    members: 87,
    projects: 12,
    active_sprints: 5,
    monthly_recurring_revenue: 1799,
    ai_tokens_30d: 26_700_000,
    storage_gb: 184.3,
    health: 94,
    created_at: '2024-06-30T11:00:00Z',
    owner_name: 'Eli Tanaka',
    owner_initials: 'ET',
    owner_color: '#9C7DD6',
    region: 'us',
  },
  {
    id: 'org-veritas',
    name: 'Veritas Legal',
    slug: 'veritas-legal',
    plan: 'team',
    status: 'trial',
    members: 6,
    projects: 1,
    active_sprints: 1,
    monthly_recurring_revenue: 0,
    ai_tokens_30d: 210_000,
    storage_gb: 0.6,
    health: 68,
    created_at: '2025-05-28T12:45:00Z',
    owner_name: 'Hana Okafor',
    owner_initials: 'HO',
    owner_color: '#4a90e8',
    region: 'eu',
  },
  {
    id: 'org-helix',
    name: 'Helix Biotech',
    slug: 'helix-bio',
    plan: 'business',
    status: 'past_due',
    members: 14,
    projects: 3,
    active_sprints: 0,
    monthly_recurring_revenue: 199,
    ai_tokens_30d: 1_100_000,
    storage_gb: 12.0,
    health: 41,
    created_at: '2024-12-19T16:00:00Z',
    owner_name: 'Carmen Ruiz',
    owner_initials: 'CR',
    owner_color: '#F09595',
    region: 'us',
  },
  {
    id: 'org-northwave',
    name: 'Northwave Studio',
    slug: 'northwave',
    plan: 'team',
    status: 'active',
    members: 9,
    projects: 2,
    active_sprints: 1,
    monthly_recurring_revenue: 49,
    ai_tokens_30d: 540_000,
    storage_gb: 2.3,
    health: 86,
    created_at: '2025-03-15T10:00:00Z',
    owner_name: 'Sven Bergen',
    owner_initials: 'SB',
    owner_color: '#7AA7E0',
    region: 'eu',
  },
  {
    id: 'org-rocket',
    name: 'Rocket Edu',
    slug: 'rocket-edu',
    plan: 'starter',
    status: 'active',
    members: 3,
    projects: 1,
    active_sprints: 1,
    monthly_recurring_revenue: 0,
    ai_tokens_30d: 70_000,
    storage_gb: 0.3,
    health: 74,
    created_at: '2025-06-01T09:00:00Z',
    owner_name: 'Maya Chen',
    owner_initials: 'MC',
    owner_color: '#7DC8B8',
    region: 'apac',
  },
  {
    id: 'org-quantum',
    name: 'Quantum Forge',
    slug: 'quantum-forge',
    plan: 'enterprise',
    status: 'active',
    members: 156,
    projects: 18,
    active_sprints: 7,
    monthly_recurring_revenue: 1799,
    ai_tokens_30d: 41_500_000,
    storage_gb: 312.8,
    health: 97,
    created_at: '2024-03-22T08:00:00Z',
    owner_name: 'Anaïs Dubois',
    owner_initials: 'AD',
    owner_color: '#1a73e8',
    region: 'eu',
  },
  {
    id: 'org-bento',
    name: 'Bento Restaurants',
    slug: 'bento',
    plan: 'starter',
    status: 'churned',
    members: 0,
    projects: 0,
    active_sprints: 0,
    monthly_recurring_revenue: 0,
    ai_tokens_30d: 0,
    storage_gb: 0.0,
    health: 0,
    created_at: '2024-10-04T13:30:00Z',
    owner_name: 'Tom Ohara',
    owner_initials: 'TO',
    owner_color: '#666',
    region: 'apac',
  },
  {
    id: 'org-glacier',
    name: 'Glacier Logistics',
    slug: 'glacier',
    plan: 'business',
    status: 'active',
    members: 22,
    projects: 3,
    active_sprints: 2,
    monthly_recurring_revenue: 199,
    ai_tokens_30d: 2_180_000,
    storage_gb: 17.4,
    health: 90,
    created_at: '2024-08-11T10:30:00Z',
    owner_name: 'Lukas Müller',
    owner_initials: 'LM',
    owner_color: '#9C7DD6',
    region: 'eu',
  },
];

// -----------------------------------------------------------------------------
// Platform-level metrics for SA-02
// -----------------------------------------------------------------------------

export type DailyMetric = { date: string; value: number };

function dayLabel(daysBack: number): string {
  const d = new Date('2025-06-11T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

// 30 days of synthetic-but-plausible series.
function series(seed: number, base: number, jitter: number, growth = 0): DailyMetric[] {
  // Deterministic pseudo-random via sine waves so the chart stays stable.
  return Array.from({ length: 30 }, (_, i) => {
    const day = 29 - i;
    const wave = Math.sin((i + seed) * 0.7) * jitter;
    const trend = i * growth;
    return { date: dayLabel(day), value: Math.max(0, Math.round(base + wave + trend)) };
  });
}

export const platformMetrics = {
  // New orgs created per day
  newOrgsDaily: series(1, 3, 1.6, 0.05),
  // MAU per day
  mauDaily: series(7, 1240, 90, 6),
  // AI tokens consumed per day (millions)
  aiTokensDaily: series(13, 3.2, 0.9, 0.04).map((d) => ({ ...d, value: Number(d.value.toFixed(2)) })),
  // Sprint completion rate per day (%)
  completionDaily: series(19, 74, 6).map((d) => ({ ...d, value: Math.min(98, d.value) })),
};

// Aggregate KPI cards
export const platformKpis = (() => {
  const totalOrgs = mockOrgs.length;
  const activeOrgs = mockOrgs.filter((o) => o.status === 'active').length;
  const trialOrgs = mockOrgs.filter((o) => o.status === 'trial').length;
  const churnedOrgs = mockOrgs.filter((o) => o.status === 'churned').length;
  const pastDueOrgs = mockOrgs.filter((o) => o.status === 'past_due').length;
  const mrr = mockOrgs.reduce((s, o) => s + o.monthly_recurring_revenue, 0);
  const arr = mrr * 12;
  const members = mockOrgs.reduce((s, o) => s + o.members, 0);
  const activeSprints = mockOrgs.reduce((s, o) => s + o.active_sprints, 0);
  const aiTokens = mockOrgs.reduce((s, o) => s + o.ai_tokens_30d, 0);
  const storage = mockOrgs.reduce((s, o) => s + o.storage_gb, 0);
  return {
    totalOrgs,
    activeOrgs,
    trialOrgs,
    churnedOrgs,
    pastDueOrgs,
    mrr,
    arr,
    members,
    activeSprints,
    aiTokens,
    storage,
  };
})();

// -----------------------------------------------------------------------------
// Audit-log style platform events (right rail on SA-02)
// -----------------------------------------------------------------------------

export type PlatformEvent = {
  id: string;
  kind: 'org_created' | 'plan_change' | 'churn' | 'incident' | 'limit' | 'release';
  title: string;
  body: string;
  at: string;
};

export const platformEvents: PlatformEvent[] = [
  {
    id: 'e-1',
    kind: 'org_created',
    title: 'Rocket Edu joined the Starter plan',
    body: 'Created by Maya Chen · apac region. 3 seats used on first day.',
    at: '2025-06-11T08:14:00Z',
  },
  {
    id: 'e-2',
    kind: 'plan_change',
    title: 'NEXUS Studio upgraded Team → Business',
    body: 'Upsell trigger: hit 8 seats + needed RAG agent access.',
    at: '2025-06-10T18:42:00Z',
  },
  {
    id: 'e-3',
    kind: 'limit',
    title: 'Foundry Labs at 78% of monthly AI quota',
    body: 'Auto-alert sent to org_admins. ETA to cap: 7 days.',
    at: '2025-06-10T11:09:00Z',
  },
  {
    id: 'e-4',
    kind: 'incident',
    title: 'Helix Biotech payment failed (3rd retry)',
    body: 'Card declined · org marked past_due · grace window 5 days.',
    at: '2025-06-09T21:30:00Z',
  },
  {
    id: 'e-5',
    kind: 'release',
    title: 'v0.4.0 deployed to production',
    body: 'Phase 4A + 4B · Tasks · Backlog · Notifications · Settings.',
    at: '2025-06-09T16:00:00Z',
  },
  {
    id: 'e-6',
    kind: 'churn',
    title: 'Bento Restaurants churned',
    body: 'Reason: switched to spreadsheets after 2 months. Exit survey attached.',
    at: '2025-06-07T10:15:00Z',
  },
];
