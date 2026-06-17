'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { Toggle } from '@/components/ui/toggle-bar';
import {
  mockProjects,
  mockTasks,
  type MockTask,
  type MockTaskPriority,
  type MockTaskStatus,
} from '@/lib/mock/yallo';

export function MockBacklog() {
  const initial = useMemo(() => mockTasks.filter((t) => !t.sprint_id), []);
  const [extra, setExtra] = useState<MockTask[]>([]);
  const [creating, setCreating] = useState(false);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<MockTaskPriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MockTaskStatus | 'all'>('all');

  const all = useMemo(() => [...initial, ...extra], [initial, extra]);
  const filtered = useMemo(() => {
    return all.filter(
      (t) =>
        (projectFilter === 'all' || t.project_id === projectFilter) &&
        (priorityFilter === 'all' || t.priority === priorityFilter) &&
        (statusFilter === 'all' || t.status === statusFilter)
    );
  }, [all, projectFilter, priorityFilter, statusFilter]);

  const totalPts = filtered.reduce((s, t) => s + (t.story_points ?? 0), 0);
  const criticalCount = filtered.filter((t) => t.priority === 'critical').length;

  // Per-project rollup
  const byProject = useMemo(() => {
    const out: Record<string, { count: number; pts: number }> = {};
    for (const t of all) {
      if (!out[t.project_id]) out[t.project_id] = { count: 0, pts: 0 };
      out[t.project_id].count += 1;
      out[t.project_id].pts += t.story_points ?? 0;
    }
    return out;
  }, [all]);

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <Link
        href="/sprints"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-3.5" />
        All sprints
      </Link>

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">T-05 · Backlog</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Backlog</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-[640px]">
            Every task across every project that hasn&apos;t been pulled into a sprint yet. Groom, prioritise,
            and pull into the next sprint when capacity allows.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          New backlog task
        </Button>
      </div>

      {/* Per-project rollup tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {mockProjects.map((p) => {
          const rollup = byProject[p.id] ?? { count: 0, pts: 0 };
          const isActive = projectFilter === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setProjectFilter(isActive ? 'all' : p.id)}
              className={
                'text-left rounded-xl border bg-card p-4 transition-colors ' +
                (isActive
                  ? 'border-gold/50 bg-gold/[0.04]'
                  : 'border-border hover:border-gold/30')
              }
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: p.color }}>
                  {p.key}
                </span>
              </div>
              <div className="mt-2 text-[13px] font-semibold line-clamp-1">{p.name}</div>
              <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <span>{rollup.count} tasks</span>
                <span className="text-gold">{rollup.pts} pts</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter bar + summary */}
      <Card className="bg-[#0A0A0A]">
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex flex-wrap gap-3">
            <Toggle
              label="Project"
              value={projectFilter}
              onChange={(v) => setProjectFilter(v)}
              options={[
                { value: 'all', label: 'All' },
                ...mockProjects.map((p) => ({ value: p.id, label: p.key })),
              ]}
            />
            <Toggle
              label="Priority"
              value={priorityFilter}
              onChange={(v) => setPriorityFilter(v as MockTaskPriority | 'all')}
              options={[
                { value: 'all', label: 'All' },
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
            <Toggle
              label="Status"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as MockTaskStatus | 'all')}
              options={[
                { value: 'all', label: 'All' },
                { value: 'todo', label: 'To do' },
                { value: 'in_progress', label: 'In progress' },
                { value: 'blocked', label: 'Blocked' },
              ]}
            />
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em]">
            <Badge variant="default">{filtered.length} tasks</Badge>
            <Badge variant="gold">{totalPts} pts</Badge>
            {criticalCount > 0 && (
              <Badge variant="red">
                <Sparkles className="size-2.5 mr-1" />
                {criticalCount} critical
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Per-project sections when "all" is selected, single list otherwise */}
      {projectFilter === 'all' ? (
        <div className="space-y-8">
          {mockProjects.map((p) => {
            const tasks = filtered.filter((t) => t.project_id === p.id);
            if (tasks.length === 0) return null;
            return (
              <section key={p.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: p.color }} aria-hidden />
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.12em]"
                      style={{ color: p.color }}
                    >
                      {p.key}
                    </span>
                    <span className="text-[13px] font-semibold">{p.name}</span>
                  </div>
                  <Link
                    href={`/projects/${p.key.toLowerCase()}/backlog`}
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-gold"
                  >
                    Open project backlog
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
                <TaskList tasks={tasks} />
              </section>
            );
          })}
        </div>
      ) : (
        <TaskList tasks={filtered} emptyMessage="Backlog is empty. New ideas go here." />
      )}

      <TaskFormDialog
        open={creating}
        onOpenChange={setCreating}
        defaultProjectId={projectFilter === 'all' ? mockProjects[0].id : projectFilter}
        defaultSprintId={null}
        onSave={(t) => setExtra((prev) => [...prev, t])}
      />
    </div>
  );
}
