'use client';
import { format } from 'date-fns';
import { AlertTriangle, Bot, Calendar, User as UserIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { StatusBadge, PriorityDot } from '@/components/tasks/StatusBadge';
import { projectById, userById, type MockTask } from '@/lib/mock/gbm';
import { cn } from '@/lib/utils';

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
}: {
  task: MockTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="responsiveTaskPanel" className="p-0 flex flex-col">
        {task && (
          <>
            <SheetHeader className="px-5 sm:px-6 pt-6 pb-4 border-b border-border">
              <div className="flex items-center flex-wrap gap-2">
                <PriorityDot priority={task.priority} />
                <span className="font-mono text-[12px] font-semibold text-gold">{task.task_key}</span>
                <Badge variant="outline" className="text-[9px]">
                  {task.type}
                </Badge>
                <StatusBadge status={task.status} />
              </div>
              <SheetTitle className="text-lg sm:text-xl leading-tight pr-8">{task.title}</SheetTitle>
              {task.is_blocked && task.blocker_reason && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-[#E24B4A]/30 bg-[#E24B4A]/10 px-3 py-2">
                  <AlertTriangle className="size-4 text-[#F09595] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#F09595]">Blocker</div>
                    <SheetDescription className="text-[#F09595]/90 mt-0.5">
                      {task.blocker_reason}
                    </SheetDescription>
                  </div>
                </div>
              )}
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="px-5 sm:px-6 py-5 space-y-6">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Detail label="Assignee">
                    <OwnerLine userId={task.assignee_id} />
                  </Detail>
                  <Detail label="Reporter">
                    <OwnerLine userId={task.reporter_id} />
                  </Detail>
                  <Detail label="Story points">
                    <span className="font-mono text-[13px]">{task.story_points ?? '—'}</span>
                  </Detail>
                  <Detail label="Due">
                    <span className="inline-flex items-center gap-1.5 text-[13px]">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      {task.due_date ? format(new Date(task.due_date), 'dd MMM') : '—'}
                    </span>
                  </Detail>
                  <Detail label="Project">
                    <span className="text-[13px]">{projectById(task.project_id)?.name ?? '—'}</span>
                  </Detail>
                  <Detail label="Priority">
                    <span className="inline-flex items-center gap-2 text-[13px] capitalize">
                      <PriorityDot priority={task.priority} />
                      {task.priority}
                    </span>
                  </Detail>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Description</div>
                  <p className="text-sm leading-relaxed text-foreground/90">{task.description}</p>
                </div>

                <Separator />

                <Comments task={task} />
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function OwnerLine({ userId }: { userId: string | null | undefined }) {
  const user = userById(userId);
  if (!user) return <span className="text-[13px] text-muted-foreground">Unassigned</span>;
  return (
    <div className="flex items-center gap-2">
      <OwnerAvatar user={user} size={22} />
      <span className="text-[13px] truncate">{user.name}</span>
    </div>
  );
}

function Comments({ task }: { task: MockTask }) {
  const human = task.comments.filter((c) => c.source === 'human');
  const ai = task.comments.filter((c) => c.source === 'ai_agent');
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          Comments · {task.comments.length}
        </div>
      </div>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All · {task.comments.length}</TabsTrigger>
          <TabsTrigger value="human">Human · {human.length}</TabsTrigger>
          <TabsTrigger value="ai">AI agent · {ai.length}</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <CommentList items={task.comments} />
        </TabsContent>
        <TabsContent value="human">
          <CommentList items={human} />
        </TabsContent>
        <TabsContent value="ai">
          <CommentList items={ai} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CommentList({ items }: { items: MockTask['comments'] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        No comments in this view yet.
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((c) => (
        <li
          key={c.id}
          className={cn(
            'rounded-lg border px-4 py-3',
            c.source === 'ai_agent' ? 'border-[#7F77DD]/30 bg-[#7F77DD]/5' : 'border-border bg-[#0A0A0A]'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {c.source === 'ai_agent' ? (
              <Bot className="size-3.5 text-[#A8A2F0]" />
            ) : (
              <UserIcon className="size-3.5 text-muted-foreground" />
            )}
            <span
              className={cn(
                'font-semibold text-[12px]',
                c.source === 'ai_agent' ? 'text-[#A8A2F0]' : 'text-foreground'
              )}
            >
              {c.author_name}
            </span>
            {c.source === 'ai_agent' && (
              <Badge variant="purple" className="ml-1">
                AI agent
              </Badge>
            )}
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">
              {format(new Date(c.created_at), 'dd MMM HH:mm')}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-foreground/90">{c.body}</p>
        </li>
      ))}
    </ul>
  );
}
