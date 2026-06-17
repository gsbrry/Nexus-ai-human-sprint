'use client';
import { useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { Toggle } from '@/components/ui/toggle-bar';
import {
  mockSprints,
  projectByKey,
  tasksForProject,
  type MockTask,
  type MockTaskPriority,
  type MockTaskStatus,
} from '@/lib/mock/gbm';

export default function BacklogPage({ params }: { params: { id: string } }) {
  const project = projectByKey(params.id);
  if (!project) notFound();

  const initial = tasksForProject(project.id).filter((t) => !t.sprint_id);
  const [extra, setExtra] = useState<MockTask[]>([]);
  const [creating, setCreating] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<MockTaskPriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MockTaskStatus | 'all'>('all');

  const all = useMemo(() => [...initial, ...extra], [initial, extra]);
  const filtered = useMemo(() => {
    return all.filter(
      (t) =>
        (priorityFilter === 'all' || t.priority === priorityFilter) &&
        (statusFilter === 'all' || t.status === statusFilter)
    );
  }, [all, priorityFilter, statusFilter]);

  const totalPts = filtered.reduce((s, t) => s + (t.story_points ?? 0), 0);
  const activeSprint = mockSprints.find((s) => s.project_id === project.id && s.status === 'active');

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <Link
        href={`/projects/${project.key.toLowerCase()}`}
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-gold"
      >
        <ArrowLeft className="size-3.5" />
        {project.name}
      </Link>

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">T-05 · Backlog</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{project.name} backlog</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Tasks not yet in a sprint. Groom, prioritise, and pull into Sprint{' '}
            {activeSprint?.sprint_number ?? '—'} when ready.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          New task
        </Button>
      </div>

      <Card className="bg-[#0A0A0A]">
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex flex-wrap gap-3">
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
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <Badge variant="default">{filtered.length} tasks</Badge>
            <Badge variant="gold">{totalPts} pts</Badge>
          </div>
        </CardContent>
      </Card>

      <TaskList tasks={filtered} emptyMessage="Backlog is empty. New ideas go here." />

      <TaskFormDialog
        open={creating}
        onOpenChange={setCreating}
        defaultProjectId={project.id}
        defaultSprintId={null}
        onSave={(t) => setExtra((prev) => [...prev, t])}
      />
    </div>
  );
}
