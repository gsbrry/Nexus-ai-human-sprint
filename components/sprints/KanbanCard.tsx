'use client';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, GripVertical, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { PriorityDot } from '@/components/tasks/StatusBadge';
import { userById, type MockTask } from '@/lib/mock/yallo';
import { cn } from '@/lib/utils';

export function KanbanCard({
  task,
  dimmed,
  onClick,
}: {
  task: MockTask;
  dimmed?: boolean;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const assignee = userById(task.assignee_id);

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border bg-card transition-colors',
        isDragging ? 'opacity-30 border-gold/40' : 'border-border hover:border-gold/30',
        dimmed && 'opacity-30',
        task.is_blocked && 'border-[#E24B4A]/30'
      )}
    >
      {/* Drag handle (whole card surface) */}
      <button
        {...listeners}
        {...attributes}
        className="absolute inset-0 cursor-grab active:cursor-grabbing rounded-lg z-0"
        aria-label={`Drag ${task.task_key}`}
      />

      {/* Click target for opening details — sits above the drag layer for the meta zone */}
      <button
        onClick={onClick}
        className="relative z-10 w-full text-left p-3 space-y-2"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityDot priority={task.priority} />
          <span className="font-mono text-[10px] font-semibold text-gold">{task.task_key}</span>
          {task.is_blocked && (
            <Badge variant="red" className="ml-auto">
              <AlertTriangle className="size-2.5 mr-1" />
              blocked
            </Badge>
          )}
          <GripVertical
            className="size-3 text-[#555] opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
            aria-hidden
          />
        </div>
        <div className="text-[13px] font-medium leading-snug line-clamp-2">{task.title}</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.comments.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                <MessageSquare className="size-3" />
                {task.comments.length}
              </span>
            )}
            <span className="font-mono text-[10px] text-muted-foreground">{task.story_points ?? '—'} pts</span>
          </div>
          {assignee && <OwnerAvatar user={assignee} size={20} />}
        </div>
      </button>
    </div>
  );
}
