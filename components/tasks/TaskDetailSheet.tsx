'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Bot, Calendar, Loader2, Send, User as UserIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { StatusBadge, PriorityDot } from '@/components/tasks/StatusBadge';
import { ownerId, userMap, type BoardComment, type BoardTask, type BoardUser } from '@/lib/board';
import { cn } from '@/lib/utils';

export function TaskDetailSheet({
  task,
  users,
  projectName,
  open,
  onOpenChange,
  live = false,
}: {
  task: BoardTask | null;
  users: BoardUser[];
  projectName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Live mode loads the thread from /api/comments and enables the composer. */
  live?: boolean;
}) {
  const directory = useMemo(() => userMap(users), [users]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="responsiveTaskPanel" className="p-0 flex flex-col">
        {task && (
          <>
            <SheetHeader className="px-5 sm:px-6 pt-6 pb-4 border-b border-border">
              <div className="flex items-center flex-wrap gap-2">
                <PriorityDot priority={task.priority} />
                <span className="font-mono text-[12px] font-semibold text-primary">{task.task_key}</span>
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
                    <OwnerLine user={directory.get(ownerId(task) ?? '')} />
                  </Detail>
                  <Detail label="Reporter">
                    <OwnerLine user={task.reporter_id ? directory.get(task.reporter_id) : undefined} />
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
                    <span className="text-[13px]">{projectName ?? '—'}</span>
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
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {task.description || 'No description yet.'}
                  </p>
                </div>

                <Separator />

                <Comments task={task} live={live} />
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

function OwnerLine({ user }: { user: BoardUser | undefined }) {
  if (!user) return <span className="text-[13px] text-muted-foreground">Unassigned</span>;
  return (
    <div className="flex items-center gap-2">
      <OwnerAvatar user={user} size={22} />
      <span className="text-[13px] truncate">{user.name}</span>
    </div>
  );
}

function Comments({ task, live }: { task: BoardTask; live: boolean }) {
  const [items, setItems] = useState<BoardComment[]>(task.comments ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/comments?task_id=${encodeURIComponent(task.id)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not load comments');
      setItems(json.comments as BoardComment[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load comments');
    } finally {
      setLoading(false);
    }
  }, [task.id]);

  useEffect(() => {
    if (!live) {
      setItems(task.comments ?? []);
      return;
    }
    void load();
  }, [live, load, task.comments]);

  const human = items.filter((c) => c.source === 'human');
  const ai = items.filter((c) => c.source === 'ai_agent');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          Comments · {items.length}
        </div>
        {loading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      </div>

      {error && (
        <div className="rounded-md border border-[#E24B4A]/30 bg-[#E24B4A]/10 px-3 py-2 text-[12px] text-[#F09595]">
          {error}
        </div>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All · {items.length}</TabsTrigger>
          <TabsTrigger value="human">Human · {human.length}</TabsTrigger>
          <TabsTrigger value="ai">AI agent · {ai.length}</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <CommentList items={items} />
        </TabsContent>
        <TabsContent value="human">
          <CommentList items={human} />
        </TabsContent>
        <TabsContent value="ai">
          <CommentList items={ai} />
        </TabsContent>
      </Tabs>

      {live && <CommentComposer taskId={task.id} onPosted={(c) => setItems((prev) => [...prev, c])} />}
    </div>
  );
}

/**
 * Composer with the AI-agent source selector Aria specified: an SM pastes an AI
 * team's update and flags it as `ai_agent`, so it renders with the purple badge.
 */
function CommentComposer({
  taskId,
  onPosted,
}: {
  taskId: string;
  onPosted: (c: BoardComment) => void;
}) {
  const [body, setBody] = useState('');
  const [source, setSource] = useState<'human' | 'ai_agent'>('human');
  const [agentName, setAgentName] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!body.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          body: body.trim(),
          source,
          author_name: source === 'ai_agent' ? agentName.trim() || 'AI agent' : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not post comment');
      onPosted(json.comment as BoardComment);
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post comment');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-[#0A0A0A] p-3">
      <div className="flex items-center gap-1">
        <SourceTab active={source === 'human'} onClick={() => setSource('human')}>
          <UserIcon className="size-3" /> Human
        </SourceTab>
        <SourceTab active={source === 'ai_agent'} onClick={() => setSource('ai_agent')}>
          <Bot className="size-3" /> AI agent
        </SourceTab>
      </div>

      {source === 'ai_agent' && (
        <input
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="Agent name (e.g. Claude Code)"
          className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-[12px] outline-none focus:border-primary/50"
        />
      )}

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={source === 'ai_agent' ? 'Paste the AI team update…' : 'Add a comment…'}
        rows={3}
        className="text-[13px]"
      />

      {error && <div className="text-[12px] text-[#F09595]">{error}</div>}

      <div className="flex justify-end">
        <Button size="sm" onClick={submit} disabled={!body.trim() || sending}>
          {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          <span className="ml-1.5">Comment</span>
        </Button>
      </div>
    </div>
  );
}

function SourceTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors',
        active
          ? 'bg-primary/15 text-primary border border-primary/40'
          : 'border border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

function CommentList({ items }: { items: BoardComment[] }) {
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
