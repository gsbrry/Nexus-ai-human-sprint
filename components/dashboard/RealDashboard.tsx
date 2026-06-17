import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  AlertOctagon,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CircleDashed,
  Database,
  FolderKanban,
  Repeat,
  Rocket,
  Sparkles,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SeedDemoButton } from '@/components/setup/SeedDemoButton';

type Project = {
  id: string;
  key: string;
  name: string;
  status: string;
  color: string | null;
};

type Sprint = {
  id: string;
  name: string;
  status: string;
  sprint_number: number;
  start_date: string;
  end_date: string;
  goal: string | null;
  capacity_points: number | null;
  projects: { key: string; name: string; color: string | null } | null;
};

type Task = {
  id: string;
  status: string;
  is_blocked: boolean;
  story_points: number | null;
  sprint_id: string | null;
};

export async function RealDashboard() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch the user's primary org
  const { data: membership, error: membershipErr } = await supabase
    .from('org_members')
    .select('org_id, role, organisations(id, slug, name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  // Migrations not run yet → org_members table doesn't exist → friendly error.
  if (membershipErr) {
    return <MigrationsMissing message={membershipErr.message} />;
  }

  if (!membership?.org_id) {
    return <EmptyWorkspace user={user} />;
  }

  const orgId = membership.org_id;
  const org = membership.organisations as { id: string; slug: string; name: string } | null;

  // Parallel fetch dashboard data (RLS scoped to this user's orgs)
  const [
    { data: projects, count: projectCount },
    { count: memberCount },
    { data: openTasks, count: openTaskCount },
    { count: blockerCount },
    { data: activeSprints },
    { data: myTasks },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, key, name, status, color', { count: 'exact' })
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
    supabase
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId),
    supabase
      .from('tasks')
      .select('id, status, is_blocked, story_points, sprint_id', { count: 'exact' })
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .neq('status', 'done')
      .limit(1000),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .eq('is_blocked', true)
      .neq('status', 'done'),
    supabase
      .from('sprints')
      .select(
        'id, name, status, sprint_number, start_date, end_date, goal, capacity_points, projects(key, name, color)'
      )
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(5),
    supabase
      .from('tasks')
      .select('id, task_key, title, status, priority, story_points, projects(key, color)')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .eq('assignee_id', user.id)
      .neq('status', 'done')
      .order('priority', { ascending: false })
      .limit(8),
    supabase.from('profiles').select('full_name, email, role').eq('id', user.id).single(),
  ]);

  const tasksArr = (openTasks ?? []) as Task[];
  const inProgress = tasksArr.filter((t) => t.status === 'in_progress').length;
  const todo = tasksArr.filter((t) => t.status === 'todo').length;

  const firstName = (profile?.full_name ?? user.email ?? 'there').split(' ')[0];

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      {/* Welcome banner */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            D-03 · Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {firstName}.
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {org?.name} · {orgRoleLabel(membership.role)} · Live data from Supabase 🟢
          </p>
        </div>
        <Badge variant="gold" className="font-mono">
          <Database className="size-3" />
          Real DB
        </Badge>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Projects" value={projectCount ?? 0} icon={FolderKanban} />
        <Kpi label="Members" value={memberCount ?? 0} icon={Users} />
        <Kpi label="Open tasks" value={openTaskCount ?? 0} icon={CircleDashed} sub={`${inProgress} in progress · ${todo} todo`} />
        <Kpi label="Blockers" value={blockerCount ?? 0} icon={AlertOctagon} tone={(blockerCount ?? 0) > 0 ? 'red' : undefined} />
      </div>

      {/* Active sprints */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-end justify-between flex-wrap gap-2 mb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                T-01 · Active sprints
              </div>
              <div className="text-base font-bold">In flight right now</div>
            </div>
            <Link
              href="/sprints"
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
            >
              All sprints
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
          {!activeSprints || activeSprints.length === 0 ? (
            <EmptySection text="No active sprints yet." cta={{ href: '/sprints', label: 'Start a sprint' }} />
          ) : (
            <div className="space-y-2">
              {(activeSprints as unknown as Sprint[]).map((s) => {
                const sprintTasks = tasksArr.filter((t) => t.sprint_id === s.id);
                return (
                  <Link
                    key={s.id}
                    href={`/sprints/${s.id}`}
                    className="block rounded-md border border-border bg-[#0A0A0A] hover:border-primary/30 px-4 py-3 transition-colors"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ background: s.projects?.color ?? '#666' }}
                          aria-hidden
                        />
                        <span
                          className="font-mono text-[10px] uppercase tracking-[0.12em]"
                          style={{ color: s.projects?.color ?? '#999' }}
                        >
                          {s.projects?.key}
                        </span>
                        <span className="text-[13px] font-semibold truncate">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        <Badge variant="default">{sprintTasks.length} open</Badge>
                        {s.capacity_points && <Badge variant="default">{s.capacity_points} pts cap</Badge>}
                      </div>
                    </div>
                    {s.goal && <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2">{s.goal}</p>}
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* Projects */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  P-01 · Projects
                </div>
                <div className="text-base font-bold">Your portfolio</div>
              </div>
              <Link
                href="/projects"
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
              >
                Open all
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
            {!projects || projects.length === 0 ? (
              <EmptySection text="No projects yet." cta={{ href: '/projects', label: 'Create a project' }} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(projects as Project[]).map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="rounded-md border border-border bg-[#0A0A0A] hover:border-primary/30 p-4 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: p.color ?? '#666' }}
                        aria-hidden
                      />
                      <span
                        className="font-mono text-[10px] uppercase tracking-[0.12em]"
                        style={{ color: p.color ?? '#999' }}
                      >
                        {p.key}
                      </span>
                      <Badge variant="default" className="ml-auto font-mono">
                        {p.status}
                      </Badge>
                    </div>
                    <div className="text-[13px] font-semibold line-clamp-1">{p.name}</div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My open tasks */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  T-06 · My tasks
                </div>
                <div className="text-base font-bold">Assigned to you</div>
              </div>
              <Link
                href="/tasks"
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
              >
                Open
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
            {!myTasks || myTasks.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-[12px] text-muted-foreground">
                Nothing assigned to you. 🥂
              </div>
            ) : (
              <ul className="space-y-1.5">
                {(myTasks as { id: string; task_key: string; title: string; priority: string; story_points: number | null; projects: { key: string; color: string | null } | null }[]).map((t) => (
                  <li key={t.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-b-0">
                    <span
                      className="font-mono text-[9px] uppercase tracking-[0.12em] shrink-0"
                      style={{ color: t.projects?.color ?? '#888' }}
                    >
                      {t.task_key}
                    </span>
                    <span className="text-[12px] truncate flex-1">{t.title}</span>
                    {t.story_points && (
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">{t.story_points}p</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------
function Kpi({
  label,
  value,
  icon: Icon,
  sub,
  tone,
}: {
  label: string;
  value: number | string;
  icon: typeof Building2;
  sub?: string;
  tone?: 'red';
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
          <Icon className="size-3 text-primary" />
          {label}
        </div>
        <div
          className={`text-[28px] font-extrabold font-mono mt-1 tracking-tight ${
            tone === 'red' && Number(value) > 0 ? 'text-destructive' : 'text-foreground'
          }`}
        >
          {value}
        </div>
        {sub && (
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-0.5">
            {sub}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptySection({ text, cta }: { text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="rounded-md border border-dashed border-border px-6 py-8 text-center space-y-3">
      <div className="text-[13px] text-muted-foreground">{text}</div>
      {cta && (
        <Button asChild size="sm" variant="outline">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}

function MigrationsMissing({ message }: { message: string }) {
  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 md:px-8 py-12 space-y-5">
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Setup · step 1 of 2
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Run the database migrations
        </h1>
        <p className="text-muted-foreground">
          Supabase is connected, but the NEXUS tables don&apos;t exist yet. You need to run the schema
          once.
        </p>
      </div>
      <Alert>
        <Database className="size-4" />
        <AlertTitle>Supabase says</AlertTitle>
        <AlertDescription className="font-mono text-[11px] mt-1">{message}</AlertDescription>
      </Alert>
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            How to fix in 2 minutes
          </div>
          <ol className="space-y-3 list-decimal pl-5 text-[13px]">
            <li>
              Open{' '}
              <a
                href="https://supabase.com/dashboard/project/pvmtmpuilfhkunpzeffw/sql/new"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                Supabase SQL editor →
              </a>
            </li>
            <li>
              In a terminal on this container, run{' '}
              <code className="bg-card border border-border rounded px-1.5 py-0.5 font-mono text-[11px]">
                cat /app/supabase/_bundle_schema.sql
              </code>{' '}
              and copy everything.
            </li>
            <li>Paste into the SQL editor and click <strong>Run</strong>. Should take ~2 seconds.</li>
            <li>
              Come back and refresh this page. The dashboard will switch to the seeding step
              automatically.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyWorkspace({ user }: { user: { id: string; email?: string } }) {
  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 md:px-8 py-12 space-y-5">
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Setup · step 2 of 2
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Seed the demo workspace
        </h1>
        <p className="text-muted-foreground">
          Migrations are in. Now drop in some realistic demo data so every screen has something to show.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
              <Sparkles className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-bold">What this creates</div>
              <ul className="text-[12px] text-muted-foreground mt-1.5 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3 text-primary" />
                  1 workspace (NEXUS Studio) with you as <strong>super_admin</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3 text-primary" />
                  2 projects: GBM (GBM Curriculum 2.0) and NEX (this platform)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3 text-primary" />
                  2 active sprints with realistic goals
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3 text-primary" />
                  14 tasks across status / priority / blocker states
                </li>
              </ul>
            </div>
          </div>
          <SeedDemoButton />
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground text-center">
            Signed in as {user.email}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function orgRoleLabel(r: string) {
  switch (r) {
    case 'super_admin':
      return 'Super admin';
    case 'org_admin':
      return 'Org admin';
    case 'scrum_master':
      return 'Scrum master';
    default:
      return 'Member';
  }
}
