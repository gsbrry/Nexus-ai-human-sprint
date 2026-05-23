'use client';
import { useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, LayoutGrid, ListChecks, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskList } from '@/components/tasks/TaskList';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { KanbanBoard } from '@/components/sprints/KanbanBoard';
import {
  mockSprints,
  projectById,
  tasksForSprint,
  userById,
  type MockTask,
} from '@/lib/mock/yallo';
import { cn } from '@/lib/utils';

export default function SprintDetailPage({ params }: { params: { id: string } }) {
  const sprint = mockSprints.find((s) => s.id === params.id);
  if (!sprint) notFound();

  const project = projectById(sprint.project_id)!;
  const initialTasks = tasksForSprint(sprint.id);
  const [tasks, setTasks] = useState<MockTask[]>(initialTasks);
  const [view, setView] = useState<'plan' | 'board'>('board');

  const totalPts = tasks.reduce((s, t) => s + (t.story_points ?? 0), 0);
  const donePts = tasks.filter((t) => t.status === 'done').reduce((s, t) => s + (t.story_points ?? 0), 0);
  const pct = Math.round((donePts / Math.max(1, totalPts)) * 100);

  // Per-assignee summary for plan view
  const byAssignee = tasks.reduce<Record<string, { user: ReturnType<typeof userById>; tasks: MockTask[]; pts: number }>>(
    (acc, t) => {
      const key = t.assignee_id ?? 'unassigned';
      if (!acc[key]) acc[key] = { user: userById(t.assignee_id), tasks: [], pts: 0 };
      acc[key].tasks.push(t);
      acc[key].pts += t.story_points ?? 0;
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <Link
        href="/sprints"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-3.5" />
        All sprints
      </Link>

      {/* Header */}
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

        {/* View toggle */}
        <div className="inline-flex items-center gap-0.5 rounded-md bg-[#0A0A0A] p-0.5 border border-border">
          <button
            onClick={() => setView('plan')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-[0.1em] transition-colors',
              view === 'plan' ? 'bg-card text-gold border border-gold/30' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ListChecks className="size-3.5" />
            Plan
          </button>
          <button
            onClick={() => setView('board')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-[0.1em] transition-colors',
              view === 'board' ? 'bg-card text-gold border border-gold/30' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutGrid className="size-3.5" />
            Board
          </button>
        </div>
      </div>

      {/* Stats / burndown */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Mini label="Tasks" value={tasks.length.toString()} />
            <Mini label="Committed" value={`${totalPts} pts`} />
            <Mini label="Done" value={`${donePts} pts`} tone="gold" />
            <Mini
              label="Blockers"
              value={tasks.filter((t) => t.is_blocked).length.toString()}
              tone={tasks.some((t) => t.is_blocked) ? 'red' : undefined}
            />
          </div>
          <div>
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1.5">
              <span>Burndown</span>
              <span>
                {donePts} / {totalPts} pts · {pct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#0A0A0A] border border-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View body */}
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
                      {group.user?.role.replace('_', ' ') ?? 'unassigned'} · {group.tasks.length} task{group.tasks.length === 1 ? '' : 's'} · {group.pts} pts
                    </div>
                  </div>
                </div>
                <TaskList tasks={group.tasks} />
              </div>
            ))}
        </div>
      )}
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
