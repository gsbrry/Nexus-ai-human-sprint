'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { PriorityDot, StatusBadge } from '@/components/tasks/StatusBadge';
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet';
import { userById, type MockTask } from '@/lib/mock/yallo';
import { cn } from '@/lib/utils';

export function TaskList({
  tasks,
  variant = 'rows',
  emptyMessage,
}: {
  tasks: MockTask[];
  variant?: 'rows' | 'cards';
  emptyMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<MockTask | null>(null);

  function openTask(t: MockTask) {
    setActive(t);
    setOpen(true);
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage ?? 'No tasks here yet.'}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onClick={() => openTask(t)} />
          ))}
        </div>
        <TaskDetailSheet task={active} open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_120px_90px_90px_80px] gap-3 px-4 py-2.5 bg-[#0A0A0A] border-b border-border font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          <div>Task</div>
          <div>Title</div>
          <div>Assignee</div>
          <div>Status</div>
          <div>Pts</div>
          <div className="text-right">Due</div>
        </div>
        {tasks.map((t) => {
          const assignee = userById(t.assignee_id);
          return (
            <button
              key={t.id}
              onClick={() => openTask(t)}
              className="w-full text-left grid grid-cols-[100px_1fr_120px_90px_90px_80px] gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-white/[0.02] transition-colors items-center"
            >
              <div className="font-mono text-[11px] font-semibold text-gold">{t.task_key}</div>
              <div className="flex items-center gap-2 min-w-0">
                <PriorityDot priority={t.priority} />
                <span className="text-[13px] truncate">{t.title}</span>
                {t.is_blocked && (
                  <Badge variant="red" className="shrink-0">
                    <AlertTriangle className="size-2.5 mr-1" />
                    blocked
                  </Badge>
                )}
                {t.comments.length > 0 && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                    <MessageSquare className="size-3" />
                    {t.comments.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                {assignee ? (
                  <>
                    <OwnerAvatar user={assignee} size={20} />
                    <span className="text-[12px] truncate">{assignee.name.split(' ')[0]}</span>
                  </>
                ) : (
                  <span className="text-[12px] text-muted-foreground">Unassigned</span>
                )}
              </div>
              <div>
                <StatusBadge status={t.status} />
              </div>
              <div className="font-mono text-[12px]">{t.story_points ?? '—'}</div>
              <div className="font-mono text-[11px] text-muted-foreground text-right">
                {t.due_date ? format(new Date(t.due_date), 'dd MMM') : '—'}
              </div>
            </button>
          );
        })}
      </div>
      <TaskDetailSheet task={active} open={open} onOpenChange={setOpen} />
    </>
  );
}

function TaskCard({ task, onClick }: { task: MockTask; onClick: () => void }) {
  const assignee = userById(task.assignee_id);
  return (
    <button
      onClick={onClick}
      className={cn(
        'group text-left rounded-xl border border-border bg-card hover:bg-[#222] hover:border-gold/30 transition-colors p-4 space-y-3'
      )}
    >
      <div className="flex items-center gap-2">
        <PriorityDot priority={task.priority} />
        <span className="font-mono text-[10px] font-semibold text-gold">{task.task_key}</span>
        {task.is_blocked && (
          <Badge variant="red" className="ml-auto">
            blocked
          </Badge>
        )}
      </div>
      <div className="text-[13px] font-medium leading-snug line-clamp-2">{task.title}</div>
      <div className="flex items-center justify-between">
        <StatusBadge status={task.status} />
        <div className="flex items-center gap-2">
          {task.comments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <MessageSquare className="size-3" />
              {task.comments.length}
            </span>
          )}
          <span className="font-mono text-[10px] text-muted-foreground">{task.story_points ?? '—'} pts</span>
          {assignee && <OwnerAvatar user={assignee} size={20} />}
        </div>
      </div>
    </button>
  );
}
