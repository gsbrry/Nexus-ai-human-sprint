'use client';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { KanbanCard } from './KanbanCard';
import type { MockTask, MockTaskStatus } from '@/lib/mock/gbm';

export function KanbanColumn({
  id,
  label,
  count,
  points,
  tone,
  tasks,
  onCardClick,
  activeId,
}: {
  id: MockTaskStatus;
  label: string;
  count: number;
  points: number;
  tone: string;
  tasks: MockTask[];
  onCardClick: (t: MockTask) => void;
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'shrink-0 w-[280px] sm:w-[300px] rounded-xl border bg-[#0A0A0A]/60 transition-colors flex flex-col',
        tone,
        isOver ? 'border-gold/60 bg-gold/5' : ''
      )}
    >
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          <span>{label}</span>
          <span className="text-[#555]">·</span>
          <span className="text-foreground">{count}</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">{points} pts</span>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[300px]">
        {tasks.length === 0 ? (
          <div
            className={cn(
              'rounded-lg border border-dashed border-border/60 px-3 py-8 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground',
              isOver && 'border-gold/60 text-gold'
            )}
          >
            {isOver ? 'Drop here' : 'Empty'}
          </div>
        ) : (
          tasks.map((t) => (
            <KanbanCard
              key={t.id}
              task={t}
              dimmed={activeId === t.id}
              onClick={() => onCardClick(t)}
            />
          ))
        )}
      </div>
    </div>
  );
}
