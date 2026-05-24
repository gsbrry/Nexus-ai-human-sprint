'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Activity,
  AlertOctagon,
  ArrowUpRight,
  Building2,
  Cpu,
  DollarSign,
  HardDrive,
  Hash,
  Layers,
  PartyPopper,
  Repeat,
  Rocket,
  Search,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle-bar';
import { TrendChart } from '@/components/admin/TrendChart';
import {
  mockOrgs,
  PLAN_LABEL,
  platformEvents,
  platformKpis,
  platformMetrics,
  STATUS_LABEL,
  type MockOrg,
  type OrgStatus,
  type Plan,
} from '@/lib/mock/admin';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
            SA-01 / SA-02 · Platform admin
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Super admin</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-[640px]">
            Every workspace running on Nexus. Roll-ups, growth, risk, and the audit log — all in one
            place. Mocked while Supabase is offline.
          </p>
        </div>
        <Badge variant="gold" className="font-mono">
          <Shield className="size-3" />
          Super admin only
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orgs">Organisations</TabsTrigger>
          <TabsTrigger value="events">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="orgs" className="mt-6">
          <OrgsTab />
        </TabsContent>
        <TabsContent value="events" className="mt-6">
          <EventsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SA-02 · Platform overview
// -----------------------------------------------------------------------------
function OverviewTab() {
  const k = platformKpis;
  const growthOrgs = ((k.activeOrgs - 8) / 8) * 100;
  const growthMrr = 18.4;
  const growthAi = 24.1;
  const growthCompletion = -1.8;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
      <div className="space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="Active orgs"
            value={k.activeOrgs.toString()}
            sub={`of ${k.totalOrgs} total`}
            icon={Building2}
            trend={growthOrgs}
            data={platformMetrics.newOrgsDaily}
            color="#D4A843"
          />
          <KpiCard
            label="MRR"
            value={`$${(k.mrr / 1000).toFixed(1)}k`}
            sub={`ARR $${(k.arr / 1000).toFixed(0)}k`}
            icon={DollarSign}
            trend={growthMrr}
            data={platformMetrics.mauDaily.map((d) => ({ date: d.date, value: Math.round(d.value * 0.18) }))}
            color="#7DC8B8"
          />
          <KpiCard
            label="AI tokens / 30d"
            value={`${(k.aiTokens / 1_000_000).toFixed(1)}M`}
            sub="across all orgs"
            icon={Sparkles}
            trend={growthAi}
            data={platformMetrics.aiTokensDaily}
            color="#9C7DD6"
            yFormatter={(v) => `${v}M`}
          />
          <KpiCard
            label="Sprint completion"
            value={`${platformMetrics.completionDaily.at(-1)?.value ?? 0}%`}
            sub="rolling 7d avg"
            icon={Activity}
            trend={growthCompletion}
            data={platformMetrics.completionDaily}
            color="#7AA7E0"
            yFormatter={(v) => `${v}%`}
          />
        </div>

        {/* Lifecycle + region breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
                    SA-02.01
                  </div>
                  <div className="text-base font-bold">Org lifecycle</div>
                </div>
                <Badge variant="default" className="font-mono">
                  {k.totalOrgs} workspaces
                </Badge>
              </div>
              <StackedBar
                segments={[
                  { value: k.activeOrgs, label: 'Active', color: '#D4A843' },
                  { value: k.trialOrgs, label: 'Trial', color: '#7AA7E0' },
                  { value: k.pastDueOrgs, label: 'Past due', color: '#F0C866' },
                  { value: k.churnedOrgs, label: 'Churned', color: '#666' },
                ]}
              />
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Mini label="MAU" value={(platformMetrics.mauDaily.at(-1)?.value ?? 0).toLocaleString()} icon={Users} />
                <Mini label="Members" value={k.members.toString()} icon={Hash} />
                <Mini label="Active sprints" value={k.activeSprints.toString()} icon={Repeat} tone="gold" />
                <Mini label="Storage" value={`${k.storage.toFixed(1)} GB`} icon={HardDrive} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
                    SA-02.02
                  </div>
                  <div className="text-base font-bold">Plan mix</div>
                </div>
                <Badge variant="gold" className="font-mono">
                  ${k.mrr.toLocaleString()} MRR
                </Badge>
              </div>
              <PlanMix orgs={mockOrgs} />
              <div className="grid grid-cols-3 gap-2 pt-2">
                {(['eu', 'us', 'apac'] as const).map((r) => {
                  const orgs = mockOrgs.filter((o) => o.region === r).length;
                  return (
                    <div key={r} className="rounded-md border border-border bg-[#0A0A0A] px-3 py-2">
                      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                        {r}
                      </div>
                      <div className="font-mono text-[16px] font-extrabold mt-0.5">{orgs}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Health watchlist */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
                  SA-02.03
                </div>
                <div className="text-base font-bold">Health watchlist</div>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Orgs with risk signals — past_due payments, completion drops, or AI quota near cap.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {mockOrgs
                .filter((o) => o.status !== 'active' || o.health < 75)
                .map((o) => (
                  <WatchRow key={o.id} org={o} />
                ))}
              {mockOrgs.filter((o) => o.status !== 'active' || o.health < 75).length === 0 && (
                <div className="rounded-md border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
                  Nothing on the watchlist. 🥂
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right rail: recent events */}
      <Card className="self-start">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
                SA-02.04
              </div>
              <div className="text-base font-bold">Recent events</div>
            </div>
            <Badge variant="default" className="font-mono">
              {platformEvents.length}
            </Badge>
          </div>
          <ol className="space-y-3">
            {platformEvents.slice(0, 6).map((e) => (
              <EventRow key={e.id} e={e} compact />
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SA-01 · Organisations list
// -----------------------------------------------------------------------------
function OrgsTab() {
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<Plan | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<OrgStatus | 'all'>('all');
  const [sort, setSort] = useState<'health' | 'mrr' | 'members' | 'created'>('mrr');

  const filtered = useMemo(() => {
    let rows = mockOrgs.filter(
      (o) =>
        (planFilter === 'all' || o.plan === planFilter) &&
        (statusFilter === 'all' || o.status === statusFilter) &&
        (!query.trim() ||
          o.name.toLowerCase().includes(query.toLowerCase()) ||
          o.slug.toLowerCase().includes(query.toLowerCase()) ||
          o.owner_name.toLowerCase().includes(query.toLowerCase()))
    );
    rows = rows.sort((a, b) => {
      if (sort === 'health') return b.health - a.health;
      if (sort === 'mrr') return b.monthly_recurring_revenue - a.monthly_recurring_revenue;
      if (sort === 'members') return b.members - a.members;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return rows;
  }, [query, planFilter, statusFilter, sort]);

  return (
    <div className="space-y-5">
      <Card className="bg-[#0A0A0A]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by org, slug, or owner…"
                className="pl-8 bg-card"
              />
            </div>
            <Toggle
              label="Sort"
              value={sort}
              onChange={(v) => setSort(v as typeof sort)}
              options={[
                { value: 'mrr', label: 'MRR' },
                { value: 'members', label: 'Members' },
                { value: 'health', label: 'Health' },
                { value: 'created', label: 'Newest' },
              ]}
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Toggle
              label="Plan"
              value={planFilter}
              onChange={(v) => setPlanFilter(v as Plan | 'all')}
              options={[
                { value: 'all', label: 'All' },
                { value: 'starter', label: 'Starter' },
                { value: 'team', label: 'Team' },
                { value: 'business', label: 'Business' },
                { value: 'enterprise', label: 'Enterprise' },
              ]}
            />
            <Toggle
              label="Status"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as OrgStatus | 'all')}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'trial', label: 'Trial' },
                { value: 'past_due', label: 'Past due' },
                { value: 'churned', label: 'Churned' },
              ]}
            />
            <div className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {filtered.length} of {mockOrgs.length} workspaces
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="hidden lg:grid grid-cols-[1.5fr_120px_110px_90px_110px_90px_50px] gap-3 px-5 py-2.5 bg-[#0A0A0A] border-b border-border font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            <div>Workspace</div>
            <div>Plan</div>
            <div>Status</div>
            <div>Members</div>
            <div className="text-right">MRR</div>
            <div className="text-right">Health</div>
            <div className="text-right">·</div>
          </div>
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No workspaces match those filters.
            </div>
          ) : (
            filtered.map((o) => <OrgRow key={o.id} org={o} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OrgRow({ org }: { org: MockOrg }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_120px_110px_90px_110px_90px_50px] gap-3 px-5 py-3.5 border-b border-border last:border-b-0 items-center hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="size-9 shrink-0 rounded-md flex items-center justify-center font-mono text-[11px] font-bold ring-1 ring-border"
          style={{ background: org.owner_color + '22', color: org.owner_color }}
        >
          {org.owner_initials}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold truncate">{org.name}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            nexus.dev/{org.slug} · {org.region}
          </div>
        </div>
      </div>
      <div>
        <PlanBadge plan={org.plan} />
      </div>
      <div>
        <StatusBadge status={org.status} />
      </div>
      <div className="font-mono text-[12px]">
        {org.members}
        <span className="text-muted-foreground text-[10px] ml-1">/ {org.projects}p</span>
      </div>
      <div className="font-mono text-[13px] font-bold text-right">
        {org.monthly_recurring_revenue > 0 ? (
          <span className="text-foreground">${org.monthly_recurring_revenue.toLocaleString()}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
      <div className="text-right">
        <HealthPill health={org.health} status={org.status} />
      </div>
      <div className="text-right">
        <Link
          href="#"
          className="inline-flex items-center text-muted-foreground hover:text-gold transition-colors"
          aria-label="Open workspace"
        >
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SA-02.04 · Full audit log
// -----------------------------------------------------------------------------
function EventsTab() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold mb-1">
          SA-02.05
        </div>
        <div className="text-base font-bold mb-4">Platform audit log</div>
        <ol className="space-y-3">
          {platformEvents.map((e) => (
            <EventRow key={e.id} e={e} />
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  data,
  color,
  yFormatter,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Building2;
  trend: number;
  data: { date: string; value: number }[];
  color: string;
  yFormatter?: (v: number) => string;
}) {
  const positive = trend >= 0;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
              <Icon className="size-3" style={{ color }} />
              {label}
            </div>
            <div className="text-[22px] font-extrabold font-mono mt-1 tracking-tight">{value}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              {sub}
            </div>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-mono text-[10px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded',
              positive ? 'text-[#7DC8B8] bg-[#7DC8B8]/10' : 'text-[#F09595] bg-[#F09595]/10'
            )}
          >
            {positive ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </span>
        </div>
        <div className="-mx-2 -mb-1 mt-2">
          <TrendChart data={data} height={64} color={color} yFormatter={yFormatter} />
        </div>
      </CardContent>
    </Card>
  );
}

function StackedBar({ segments }: { segments: { value: number; label: string; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="space-y-2">
      <div className="flex w-full h-2 rounded-full overflow-hidden bg-[#0A0A0A] border border-border">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em]">
            <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="text-foreground">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanMix({ orgs }: { orgs: MockOrg[] }) {
  const groups = (['starter', 'team', 'business', 'enterprise'] as Plan[]).map((p) => {
    const list = orgs.filter((o) => o.plan === p);
    const mrr = list.reduce((s, o) => s + o.monthly_recurring_revenue, 0);
    return { plan: p, count: list.length, mrr };
  });
  const maxMrr = Math.max(1, ...groups.map((g) => g.mrr));
  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <div key={g.plan} className="space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            <span>
              {PLAN_LABEL[g.plan]} · {g.count} orgs
            </span>
            <span className="text-foreground">${g.mrr.toLocaleString()}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#0A0A0A] border border-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
              style={{ width: `${(g.mrr / maxMrr) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function WatchRow({ org }: { org: MockOrg }) {
  const isPastDue = org.status === 'past_due';
  const isChurned = org.status === 'churned';
  const isTrial = org.status === 'trial';
  const lowHealth = org.health < 75;

  const Icon = isPastDue
    ? AlertOctagon
    : isChurned
    ? TrendingDown
    : isTrial
    ? Rocket
    : lowHealth
    ? Zap
    : Activity;
  const tone = isPastDue || lowHealth ? '#F09595' : isTrial ? '#F0C866' : '#7AA7E0';

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-[#0A0A0A] px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="size-8 rounded-md flex items-center justify-center ring-1"
          style={{ background: tone + '22', color: tone, borderColor: tone + '40' }}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold truncate">{org.name}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {isPastDue
              ? 'Card declined — grace window'
              : isChurned
              ? 'Churned 4 days ago'
              : isTrial
              ? 'Trial · day 14/14'
              : 'Health dropped below 75'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <HealthPill health={org.health} status={org.status} />
        <ArrowUpRight className="size-3.5 text-muted-foreground" />
      </div>
    </div>
  );
}

function EventRow({ e, compact = false }: { e: (typeof platformEvents)[number]; compact?: boolean }) {
  const meta: Record<
    (typeof platformEvents)[number]['kind'],
    { icon: typeof Building2; color: string; label: string }
  > = {
    org_created: { icon: PartyPopper, color: '#D4A843', label: 'org created' },
    plan_change: { icon: Layers, color: '#7DC8B8', label: 'plan change' },
    churn: { icon: TrendingDown, color: '#666', label: 'churn' },
    incident: { icon: AlertOctagon, color: '#F09595', label: 'incident' },
    limit: { icon: Cpu, color: '#F0C866', label: 'limit' },
    release: { icon: Rocket, color: '#9C7DD6', label: 'release' },
  };
  const m = meta[e.kind];
  const Icon = m.icon;
  return (
    <li className="flex items-start gap-3">
      <div
        className="shrink-0 size-7 rounded-md flex items-center justify-center ring-1 ring-border"
        style={{ background: m.color + '22', color: m.color }}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: m.color }}>
            {m.label}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            · {format(new Date(e.at), 'dd MMM HH:mm')}
          </span>
        </div>
        <div className={cn('font-medium leading-snug mt-0.5', compact ? 'text-[12px]' : 'text-[13px]')}>
          {e.title}
        </div>
        {!compact && <div className="text-[12px] text-muted-foreground mt-0.5">{e.body}</div>}
      </div>
    </li>
  );
}

function PlanBadge({ plan }: { plan: Plan }) {
  const color: Record<Plan, 'default' | 'blue' | 'teal' | 'gold'> = {
    starter: 'default',
    team: 'blue',
    business: 'teal',
    enterprise: 'gold',
  };
  return (
    <Badge variant={color[plan]} className="font-mono">
      {PLAN_LABEL[plan]}
    </Badge>
  );
}

function StatusBadge({ status }: { status: OrgStatus }) {
  const color: Record<OrgStatus, 'default' | 'blue' | 'gold' | 'red'> = {
    active: 'gold',
    trial: 'blue',
    past_due: 'red',
    churned: 'default',
  };
  return (
    <Badge variant={color[status]} className="font-mono">
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function HealthPill({ health, status }: { health: number; status: OrgStatus }) {
  if (status === 'churned') {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        —
      </span>
    );
  }
  const tone =
    health >= 85 ? 'text-gold border-gold/30 bg-gold/10' : health >= 70 ? 'text-[#F0C866] border-[#F0C866]/30 bg-[#F0C866]/10' : 'text-[#F09595] border-[#F09595]/30 bg-[#F09595]/10';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px]',
        tone
      )}
    >
      <Activity className="size-2.5" />
      {health}
    </span>
  );
}

function Mini({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Building2;
  tone?: 'gold';
}) {
  return (
    <div className="rounded-md border border-border bg-[#0A0A0A] px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
        <Icon className="size-2.5" />
        {label}
      </div>
      <div className={cn('font-mono text-[16px] font-extrabold mt-0.5', tone === 'gold' && 'text-gold')}>
        {value}
      </div>
    </div>
  );
}
