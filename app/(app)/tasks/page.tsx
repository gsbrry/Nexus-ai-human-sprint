'use client';
import { useMemo, useState } from 'react';
import { Toggle } from '@/components/ui/toggle-bar';
import { TaskList } from '@/components/tasks/TaskList';
import { CURRENT_USER_ID, mockProjects, tasksAssignedTo, type MockTask } from '@/lib/mock/yallo';

export default function MyTasksPage() {
  const [scope, setScope] = useState<'all' | string>('all');
  const [status, setStatus] = useState<'open' | 'done' | 'all'>('open');

  const tasks = useMemo<MockTask[]>(() => {
    let list = tasksAssignedTo(CURRENT_USER_ID);
    if (scope !== 'all') list = list.filter((t) => t.project_id === scope);
    if (status === 'open') list = list.filter((t) => t.status !== 'done');
    if (status === 'done') list = list.filter((t) => t.status === 'done');
    return list;
  }, [scope, status]);

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-6">
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">T-06 · My tasks</div>
        <h1 className="text-3xl font-extrabold tracking-tight">My tasks</h1>
        <p className="text-muted-foreground">Across every project you’re a member of.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Toggle
          label="Project"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'all', label: 'All projects' },
            ...mockProjects.map((p) => ({ value: p.id, label: p.key })),
          ]}
        />
        <Toggle
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as 'open' | 'done' | 'all')}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'done', label: 'Done' },
            { value: 'all', label: 'All' },
          ]}
        />
        <div className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {tasks.length} task{tasks.length === 1 ? '' : 's'}
        </div>
      </div>

      <TaskList tasks={tasks} emptyMessage="Nothing matches those filters." />
    </div>
  );
}
