import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrg } from '@/lib/server/feature-flag';
import { EmptyOrgPrompt } from '@/components/setup/EmptyOrgPrompt';

type Task = {
  id: string;
  task_key: string;
  title: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  story_points: number | null;
  is_blocked: boolean;
  sprint_id: string | null;
};

export async function RealProjectDetail({ projectId }: { projectId: string }) {
  const active = await getActiveOrg();
  if (!active?.org_id) return <EmptyOrgPrompt />;

  const supabase = createClient();

  // Project — try UUID first, fall back to key match for compat with mock URLs.
  let { data: project } = await supabase
    .from('projects')
    .select('id, key, name, description, color, status, start_date, target_date')
    .eq('org_id', active.org_id)
    .eq('id', projectId)
    .maybeSingle();

  if (!project) {
    const { data } = await supabase
      .from('projects')
      .select('id, key, name, description, color, status, start_date, target_date')
      .eq('org_id', active.org_id)
      .ilike('key', projectId)
      .maybeSingle();
    project = data;
  }

  if (!project) notFound();

  // Active sprint + all tasks for this project
  const [{ data: sprints }, { data: tasks }] = await Promise.all([
    supabase
      .from('sprints')
      .select('id, name, status, sprint_number, goal, start_date, end_date, capacity_points')
      .eq('project_id', project.id)
      .order('start_date', { ascending: false }),
    supabase
      .from('tasks')
      .select('id, task_key, title, status, priority, story_points, is_blocked, sprint_id')
      .eq('project_id', project.id)
      .is('deleted_at', null),
  ]);

  const activeSprint = sprints?.find((s) => s.status === 'active') ?? null;
  const allTasks = (tasks ?? []) as Task[];
  const sprintTasks = activeSprint ? allTasks.filter((t) => t.sprint_id === activeSprint.id) : [];
  const backlog = allTasks.filter((t) => !t.sprint_id);

  const donePoints = sprintTasks
    .filter((t) => t.status === 'done')
    .reduce((s, t) => s + (t.story_points ?? 0), 0);
  const totalPoints = sprintTasks.reduce((s, t) => s + (t.story_points ?? 0), 0);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        All projects
      </Link>

      <div className="flex items-start gap-5 flex-wrap">
        <div
          className="size-14 rounded-md border-[1.5px] flex items-center justify-center font-mono text-[15px] font-bold shrink-0"
          style={{
            color: project.color ?? '#999',
            background: `${project.color ?? '#222'}22`,
            borderColor: `${project.color ?? '#444'}66`,
          }}
        >
          {project.key}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              P-02 · Project detail
            </div>
            <Badge variant="gold" className="font-mono">Real DB</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground max-w-[640px]">{project.description}</p>
          )}
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {project.start_date && <>Started {format(new Date(project.start_date), 'dd MMM yyyy')}</>}
            {project.target_date && (
              <> · Target {format(new Date(project.target_date), 'dd MMM yyyy')}</>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="All tasks" value={allTasks.length.toString()} />
        <Mini label="In sprint" value={sprintTasks.length.toString()} />
        <Mini label="Backlog" value={backlog.length.toString()} />
        <Mini
          label="Blockers"
          value={allTasks.filter((t) => t.is_blocked && t.status !== 'done').length.toString()}
          tone={allTasks.some((t) => t.is_blocked) ? 'red' : undefined}
        />
      </div>

      {activeSprint && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="gold" className="font-mono">
                    Active · Sprint {activeSprint.sprint_number}
                  </Badge>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {format(new Date(activeSprint.start_date), 'dd MMM')} →{' '}
                    {format(new Date(activeSprint.end_date), 'dd MMM')}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">{activeSprint.name}</h2>
                {activeSprint.goal && (
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <Target className="size-4 text-primary shrink-0 mt-0.5" />
                    {activeSprint.goal}
                  </p>
                )}
              </div>
              <Link
                href={`/sprints/${activeSprint.id}`}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:text-primary-light border border-primary/30 rounded-md px-3 py-1.5 hover:bg-primary/10 transition-colors"
              >
                Open sprint →
              </Link>
            </div>
            <div>
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-2">
                <span>Burndown</span>
                <span>
                  {donePoints} / {totalPoints} pts
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#0A0A0A] border border-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light"
                  style={{ width: `${Math.min(100, (donePoints / Math.max(1, totalPoints)) * 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <TaskGroup title="Sprint tasks" subtitle="In the active sprint" tasks={sprintTasks} />
      {backlog.length > 0 && <TaskGroup title="Backlog" subtitle="Awaiting prioritisation" tasks={backlog} />}

      {sprints && sprints.length > 1 && (
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            All sprints
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sprints.map((s) => (
              <Link
                key={s.id}
                href={`/sprints/${s.id}`}
                className="rounded-md border border-border bg-[#0A0A0A] hover:border-primary/30 p-3 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                    Sprint {s.sprint_number}
                  </span>
                  <Badge variant={s.status === 'active' ? 'gold' : 'default'} className="font-mono">
                    {s.status}
                  </Badge>
                </div>
                <div className="text-[13px] font-medium truncate">{s.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground mt-1">
                  {format(new Date(s.start_date), 'dd MMM')} →{' '}
                  {format(new Date(s.end_date), 'dd MMM')}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskGroup({
  title,
  subtitle,
  tasks,
}: {
  title: string;
  subtitle: string;
  tasks: Task[];
}) {
  if (tasks.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{title}</div>
          <h2 className="text-lg font-bold tracking-tight">{subtitle}</h2>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {tasks.length} tasks
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground w-20 shrink-0">
                  {t.task_key}
                </span>
                <span className="text-[13px] flex-1 truncate">{t.title}</span>
                {t.is_blocked && (
                  <Badge variant="red" className="font-mono">
                    Blocked
                  </Badge>
                )}
                <Badge
                  variant={
                    t.status === 'done'
                      ? 'gold'
                      : t.status === 'in_progress'
                      ? 'blue'
                      : 'default'
                  }
                  className="font-mono"
                >
                  {t.status.replace('_', ' ')}
                </Badge>
                <Badge variant="default" className="font-mono">
                  {t.priority}
                </Badge>
                {t.story_points && (
                  <span className="font-mono text-[11px] text-muted-foreground w-8 text-right">
                    {t.story_points}p
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: 'red' }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </div>
        <div
          className={
            'text-[24px] font-extrabold font-mono mt-1 ' +
            (tone === 'red' ? 'text-destructive' : 'text-foreground')
          }
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
