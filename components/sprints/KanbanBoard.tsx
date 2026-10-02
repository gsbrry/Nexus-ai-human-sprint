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
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet';
import { Badge } from '@/components/ui/badge';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { PriorityDot } from '@/components/tasks/StatusBadge';
import {
  commentCount,
  ownerId,
  statusLabel,
  userMap,
  type BoardStatus,
  type BoardTask,
  type BoardUser,
} from '@/lib/board';
import { KanbanColumn } from './KanbanColumn';
import { cn } from '@/lib/utils';

const COLUMNS: { id: BoardStatus; tone: string }[] = [
  { id: 'todo', tone: 'border-[#555]/40' },
  { id: 'in_progress', tone: 'border-[#378ADD]/40' },
  { id: 'in_review', tone: 'border-[#7F77DD]/40' },
  { id: 'blocked', tone: 'border-[#E24B4A]/40' },
  { id: 'done', tone: 'border-[#1D9E75]/40' },
];

export function KanbanBoard({
  tasks,
  users,
  onStatusChange,
  projectName,
  live = false,
}: {
  tasks: BoardTask[];
  users: BoardUser[];
  /** Called when a card is dropped into a different column. */
  onStatusChange: (taskId: string, status: BoardStatus) => void;
  projectName?: string;
  /** When true, the detail panel loads and posts comments against the API. */
  live?: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTaskId, setSheetTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const directory = useMemo(() => userMap(users), [users]);

  const grouped = useMemo(() => {
    const m: Record<BoardStatus, BoardTask[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      blocked: [],
      done: [],
    };
    for (const t of tasks) m[t.status].push(t);
    return m;
  }, [tasks]);

  // Read the open task back out of `tasks` so the panel reflects live updates.
  const sheetTask = useMemo(
    () => (sheetTaskId ? tasks.find((t) => t.id === sheetTaskId) ?? null : null),
    [sheetTaskId, tasks]
  );

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    setActiveId(id);
    setActiveTask(tasks.find((t) => t.id === id) ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    // Drop target is either a column ID or another card ID.
    const targetCol: BoardStatus | null =
      (COLUMNS.find((c) => c.id === overId)?.id as BoardStatus | undefined) ??
      (tasks.find((t) => t.id === overId)?.status ?? null);

    if (!targetCol) return;
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.status === targetCol) return;

    onStatusChange(taskId, targetCol);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
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
              users={directory}
              onCardClick={(t) => {
                setSheetTaskId(t.id);
                setSheetOpen(true);
              }}
              activeId={activeId}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeTask ? <DragPreviewCard task={activeTask} users={directory} /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailSheet
        task={sheetTask}
        users={users}
        projectName={projectName}
        live={live}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}

function DragPreviewCard({ task, users }: { task: BoardTask; users: Map<string, BoardUser> }) {
  const assignee = users.get(ownerId(task) ?? '');
  const comments = commentCount(task);
  return (
    <div className={cn(
      'w-[280px] rounded-xl border border-primary/50 bg-card p-3 shadow-2xl shadow-primary/20 rotate-2 cursor-grabbing'
    )}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <PriorityDot priority={task.priority} />
        <span className="font-mono text-[10px] font-semibold text-primary">{task.task_key}</span>
        {task.is_blocked && (
          <Badge variant="red" className="ml-auto">
            <AlertTriangle className="size-2.5 mr-1" /> blocked
          </Badge>
        )}
      </div>
      <div className="text-[13px] font-medium leading-snug line-clamp-2 mb-2">{task.title}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {comments > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <MessageSquare className="size-3" /> {comments}
            </span>
          )}
          <span className="font-mono text-[10px] text-muted-foreground">{task.story_points ?? '—'} pts</span>
        </div>
        {assignee && <OwnerAvatar user={assignee} size={20} />}
      </div>
    </div>
  );
}
