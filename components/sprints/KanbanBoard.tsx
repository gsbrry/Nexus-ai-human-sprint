'use client';
import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet';
import { Badge } from '@/components/ui/badge';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { PriorityDot } from '@/components/tasks/StatusBadge';
import { statusLabel, userById, type MockTask, type MockTaskStatus } from '@/lib/mock/gbm';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';

const COLUMNS: { id: MockTaskStatus; tone: string }[] = [
  { id: 'todo', tone: 'border-[#555]/40' },
  { id: 'in_progress', tone: 'border-[#378ADD]/40' },
  { id: 'in_review', tone: 'border-[#7F77DD]/40' },
  { id: 'blocked', tone: 'border-[#E24B4A]/40' },
  { id: 'done', tone: 'border-[#1D9E75]/40' },
];

export function KanbanBoard({
  tasks,
  onTasksChange,
}: {
  tasks: MockTask[];
  onTasksChange: (updater: (prev: MockTask[]) => MockTask[]) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<MockTask | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTask, setSheetTask] = useState<MockTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const grouped = useMemo(() => {
    const m: Record<MockTaskStatus, MockTask[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      blocked: [],
      done: [],
    };
    for (const t of tasks) m[t.status].push(t);
    return m;
  }, [tasks]);

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    setActiveId(id);
    setActiveTask(tasks.find((t) => t.id === id) ?? null);
  }

  function handleDragOver(_e: DragOverEvent) {
    /* no-op for now; future: live re-render preview between cols */
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    // Drop target is either a column ID or another card ID.
    const targetCol: MockTaskStatus | null =
      (COLUMNS.find((c) => c.id === overId)?.id as MockTaskStatus | undefined) ??
      (tasks.find((t) => t.id === overId)?.status ?? null);

    if (!targetCol) return;

    onTasksChange((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        if (t.status === targetCol) return t;
        const next: MockTask = { ...t, status: targetCol };
        if (targetCol === 'done') next.completed_at = new Date().toISOString();
        else next.completed_at = null;
        if (targetCol === 'blocked' && !t.is_blocked) {
          next.is_blocked = true;
          next.blocker_reason = next.blocker_reason ?? 'Newly blocked — reason pending.';
        }
        if (targetCol !== 'blocked' && t.status === 'blocked') {
          next.is_blocked = false;
          next.blocker_reason = undefined;
        }
        return next;
      })
    );
    // When wired to Supabase:
    // await fetch(`/api/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status: targetCol }) });
  }

  function openSheet(task: MockTask) {
    setSheetTask(task);
    setSheetOpen(true);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 md:-mx-0 md:px-0">
          {COLUMNS.map((c) => (
            <KanbanColumn
              key={c.id}
              id={c.id}
              label={statusLabel(c.id)}
              count={grouped[c.id].length}
              points={grouped[c.id].reduce((s, t) => s + (t.story_points ?? 0), 0)}
              tone={c.tone}
              tasks={grouped[c.id]}
              onCardClick={openSheet}
              activeId={activeId}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeTask ? <DragPreviewCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailSheet task={sheetTask} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}

function DragPreviewCard({ task }: { task: MockTask }) {
  const assignee = userById(task.assignee_id);
  return (
    <div className={cn(
      'w-[280px] rounded-xl border border-gold/50 bg-card p-3 shadow-2xl shadow-gold/20 rotate-2 cursor-grabbing'
    )}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <PriorityDot priority={task.priority} />
        <span className="font-mono text-[10px] font-semibold text-gold">{task.task_key}</span>
        {task.is_blocked && (
          <Badge variant="red" className="ml-auto">
            <AlertTriangle className="size-2.5 mr-1" /> blocked
          </Badge>
        )}
      </div>
      <div className="text-[13px] font-medium leading-snug line-clamp-2 mb-2">{task.title}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.comments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <MessageSquare className="size-3" /> {task.comments.length}
            </span>
          )}
          <span className="font-mono text-[10px] text-muted-foreground">{task.story_points ?? '—'} pts</span>
        </div>
        {assignee && <OwnerAvatar user={assignee} size={20} />}
      </div>
    </div>
  );
}
