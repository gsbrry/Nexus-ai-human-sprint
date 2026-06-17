'use client';
import { useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, LayoutGrid, ListChecks, Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskList } from '@/components/tasks/TaskList';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { KanbanBoard } from '@/components/sprints/KanbanBoard';
import { BurndownChart, buildBurndownData } from '@/components/sprints/BurndownChart';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import {
  mockSprints,
  projectById,
  tasksForSprint,
  userById,
  type MockTask,
} from '@/lib/mock/gbm';
import { cn } from '@/lib/utils';

export function MockSprintDetail({ params }: { params: { id: string } }) {
  const sprint = mockSprints.find((s) => s.id === params.id);
  if (!sprint) notFound();

  const project = projectById(sprint.project_id)!;
  const initialTasks = tasksForSprint(sprint.id);
  const [tasks, setTasks] = useState<MockTask[]>(initialTasks);
  const [view, setView] = useState<'plan' | 'board'>('board');
  const [creating, setCreating] = useState(false);

  const totalPts = tasks.reduce((s, t) => s + (t.story_points ?? 0), 0);
  const donePts = tasks.filter((t) => t.status === 'done').reduce((s, t) => s + (t.story_points ?? 0), 0);
  const pct = Math.round((donePts / Math.max(1, totalPts)) * 100);

  const burndown = useMemo(
    () =>
      buildBurndownData({
        start: new Date(sprint.start_date),
        end: new Date(sprint.end_date),
        total: totalPts,
        donePoints: donePts,
        today: new Date('2025-06-11'),
      }),
    [sprint.start_date, sprint.end_date, totalPts, donePts]
  );

  const byAssignee = tasks.reduce<
    Record<string, { user: ReturnType<typeof userById>; tasks: MockTask[]; pts: number }>
  >((acc, t) => {
    const key = t.assignee_id ?? 'unassigned';
    if (!acc[key]) acc[key] = { user: userById(t.assignee_id), tasks: [], pts: 0 };
    acc[key].tasks.push(t);
    acc[key].pts += t.story_points ?? 0;
    return acc;
  }, {});

  function onTaskCreated(t: MockTask) {
    setTasks((prev) => [...prev, t]);
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <Link
        href="/sprints"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-3.5" />
        All sprints
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">T-01 · Sprint plan</div>
            <Badge variant="gold">{sprint.status}</Badge>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: project.color }}>
              {project.key} · #{sprint.sprint_number}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{sprint.name}</h1>
          <p className="text-sm text-muted-foreground max-w-[720px] flex items-start gap-2">
            <Target className="size-4 text-gold shrink-0 mt-0.5" />
            {sprint.goal}
          </p>
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {format(new Date(sprint.start_date), 'dd MMM')} → {format(new Date(sprint.end_date), 'dd MMM')}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New task
          </Button>
          <div className="inline-flex items-center gap-0.5 rounded-md bg-[#0A0A0A] p-0.5 border border-border">
            <button
              onClick={() => setView('plan')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-[0.1em] transition-colors',
                view === 'plan'
                  ? 'bg-card text-gold border border-gold/30'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ListChecks className="size-3.5" />
              Plan
            </button>
            <button
              onClick={() => setView('board')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-[0.1em] transition-colors',
                view === 'board'
                  ? 'bg-card text-gold border border-gold/30'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="size-3.5" />
              Board
            </button>
          </div>
        </div>
      </div>

      {/* V-03 burndown chart */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">V-03 · Burndown</div>
              <h2 className="text-lg font-bold tracking-tight">Daily burndown</h2>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block w-4 border-t border-dashed border-[#555]"
                  aria-hidden
                />
                Ideal
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-gold" />
                Remaining
              </span>
            </div>
          </div>
          <BurndownChart data={burndown} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
            <Mini label="Tasks" value={tasks.length.toString()} />
            <Mini label="Committed" value={`${totalPts} pts`} />
            <Mini label="Done" value={`${donePts} pts`} tone="gold" />
            <Mini
              label="Blockers"
              value={tasks.filter((t) => t.is_blocked).length.toString()}
              tone={tasks.some((t) => t.is_blocked) ? 'red' : undefined}
            />
          </div>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {pct}% complete · {tasks.filter((t) => t.status !== 'done').length} open
          </div>
        </CardContent>
      </Card>

      {view === 'board' ? (
        <KanbanBoard tasks={tasks} onTasksChange={setTasks} />
      ) : (
        <div className="space-y-6">
          {Object.entries(byAssignee)
            .sort(([, a], [, b]) => b.pts - a.pts)
            .map(([key, group]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-3">
                  {group.user ? (
                    <OwnerAvatar user={group.user} size={28} />
                  ) : (
                    <div className="size-7 rounded-full bg-card border border-border" />
                  )}
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{group.user?.name ?? 'Unassigned'}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                      {group.user?.role.replace('_', ' ') ?? 'unassigned'} · {group.tasks.length} task
                      {group.tasks.length === 1 ? '' : 's'} · {group.pts} pts
                    </div>
                  </div>
                </div>
                <TaskList tasks={group.tasks} />
              </div>
            ))}
        </div>
      )}

      <TaskFormDialog
        open={creating}
        onOpenChange={setCreating}
        defaultProjectId={project.id}
        defaultSprintId={sprint.id}
        onSave={onTaskCreated}
      />
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: 'gold' | 'red' }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div
        className={
          'font-mono text-[20px] sm:text-[22px] font-extrabold mt-0.5 ' +
          (tone === 'gold' ? 'text-gold' : tone === 'red' ? 'text-[#F09595]' : 'text-foreground')
        }
      >
        {value}
      </div>
    </div>
  );
}
