import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, AlertOctagon, CheckCircle2, LayoutGrid, ListTodo, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BurndownChart, buildBurndownData } from '@/components/sprints/BurndownChart';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrg } from '@/lib/server/feature-flag';
import { EmptyOrgPrompt } from '@/components/setup/EmptyOrgPrompt';
import { LiveKanbanBoard } from '@/components/sprints/LiveKanbanBoard';
import { fetchOrgUsers } from '@/lib/server/org-users';
import type { BoardTask } from '@/lib/board';
import { cn } from '@/lib/utils';


export async function RealSprintDetail({ sprintId }: { sprintId: string }) {
  const active = await getActiveOrg();
  if (!active?.org_id) return <EmptyOrgPrompt />;

  const supabase = createClient();
  const { data: sprint } = await supabase
    .from('sprints')
    .select('id, name, status, sprint_number, start_date, end_date, goal, capacity_points, projects(id, key, name, color)')
    .eq('org_id', active.org_id)
    .eq('id', sprintId)
    .maybeSingle();
  if (!sprint) notFound();

  const { data: tasks } = await supabase
    .from('tasks')
    .select(
      'id, task_key, title, description, project_id, sprint_id, status, priority, type, ' +
        'story_points, is_blocked, blocker_reason, assignee_id, reporter_id, due_date, ' +
        'created_at, completed_at, comments(count)'
    )
    .eq('sprint_id', sprintId)
    .is('deleted_at', null)
    .order('position', { ascending: true });

  // `comments(count)` arrives as [{ count: n }]; flatten it onto the board task.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taskList: BoardTask[] = (tasks ?? []).map((t: any) => ({
    ...t,
    comment_count: Array.isArray(t.comments) ? t.comments[0]?.count ?? 0 : 0,
    comments: undefined,
  }));

  const users = await fetchOrgUsers(supabase, active.org_id);

  const totalPts = taskList.reduce((s, t) => s + (t.story_points ?? 0), 0);
  const donePts = taskList.filter((t) => t.status === 'done').reduce((s, t) => s + (t.story_points ?? 0), 0);
  const pct = Math.round((donePts / Math.max(1, totalPts)) * 100);
  const blockerCount = taskList.filter((t) => t.is_blocked && t.status !== 'done').length;

  const burndown = buildBurndownData({
    start: new Date(sprint.start_date),
    end: new Date(sprint.end_date),
    total: totalPts,
    donePoints: donePts,
    today: new Date(),
  });

  const proj = sprint.projects as unknown as { id: string; key: string; name: string; color: string | null } | null;

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <Link
        href="/sprints"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        All sprints
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">T-01 · Sprint detail</div>
            <Badge variant="gold" className="font-mono">Real DB</Badge>
            <Badge variant={sprint.status === 'active' ? 'gold' : 'default'} className="font-mono">{sprint.status}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: proj?.color ?? '#666' }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: proj?.color ?? '#888' }}>{proj?.key}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{sprint.name}</h1>
          {sprint.goal && (
            <p className="text-muted-foreground max-w-[760px] flex items-start gap-2">
              <Target className="size-4 text-primary shrink-0 mt-0.5" />
              {sprint.goal}
            </p>
          )}
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {format(new Date(sprint.start_date), 'dd MMM')} → {format(new Date(sprint.end_date), 'dd MMM yyyy')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini icon={ListTodo} label="Tasks" value={taskList.length.toString()} />
        <Mini icon={Target} label="Committed" value={`${totalPts} pts`} />
        <Mini icon={CheckCircle2} label="Done" value={`${donePts} pts (${pct}%)`} tone="gold" />
        <Mini icon={AlertOctagon} label="Blockers" value={blockerCount.toString()} tone={blockerCount ? 'red' : undefined} />
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">V-03 · Burndown</div>
              <div className="text-base font-bold">Ideal vs remaining</div>
            </div>
            <Badge variant="default" className="font-mono">{taskList.length} tasks</Badge>
          </div>
          <BurndownChart data={burndown} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">T-02 · Board</div>
              <div className="text-base font-bold">Kanban</div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <LayoutGrid className="size-3 inline mr-1" />
              Drag a card to change status
            </div>
          </div>
          <LiveKanbanBoard initialTasks={taskList} users={users} projectName={proj?.name} />
        </CardContent>
      </Card>
    </div>
  );
}

function Mini({ icon: Icon, label, value, tone }: { icon: typeof ListTodo; label: string; value: string; tone?: 'gold' | 'red' }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
          <Icon className="size-3 text-primary" />
          {label}
        </div>
        <div className={cn('text-[20px] font-extrabold font-mono mt-1', tone === 'gold' ? 'text-primary' : tone === 'red' ? 'text-destructive' : 'text-foreground')}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
