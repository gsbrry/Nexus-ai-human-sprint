'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { KanbanBoard } from '@/components/sprints/KanbanBoard';
import { applyStatusChange, type BoardStatus, type BoardTask, type BoardUser } from '@/lib/board';

/**
 * Real-data Kanban. Viktor and Marcus signed off optimistic UI for the drag, so
 * the card moves immediately, then PATCHes /api/tasks/[id]/status. A failed write
 * rolls the board back to the server state and surfaces the error inline.
 */
export function LiveKanbanBoard({
  initialTasks,
  users,
  projectName,
}: {
  initialTasks: BoardTask[];
  users: BoardUser[];
  projectName?: string;
}) {
  const [tasks, setTasks] = useState<BoardTask[]>(initialTasks);
  const [serverTasks, setServerTasks] = useState<BoardTask[]>(initialTasks);
  const [error, setError] = useState<string | null>(null);

  // After router.refresh() the server sends a fresh array; adopt it so the board
  // settles on the authoritative rows rather than the optimistic copy.
  if (initialTasks !== serverTasks) {
    setServerTasks(initialTasks);
    setTasks(initialTasks);
  }

  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleStatusChange(taskId: string, status: BoardStatus) {
    const previous = tasks;
    setTasks((prev) => applyStatusChange(prev, taskId, status));
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Could not save the new status');
      // Pull the authoritative row back so trigger-set fields (completed_at,
      // task_key) and the sprint header totals stay in step.
      startTransition(() => router.refresh());
    } catch (e) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : 'Could not save the new status');
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-[#E24B4A]/30 bg-[#E24B4A]/10 px-3 py-2 text-[12px] text-[#F09595]">
          <AlertTriangle className="size-3.5 shrink-0" />
          {error}
        </div>
      )}
      <KanbanBoard
        tasks={tasks}
        users={users}
        projectName={projectName}
        onStatusChange={handleStatusChange}
        live
      />
    </div>
  );
}
