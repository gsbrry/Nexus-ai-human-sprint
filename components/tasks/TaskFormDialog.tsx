'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { z } from 'zod';
import { taskCreateSchema, type TaskCreateInput } from '@/lib/validations/task';

type TaskFormValues = z.input<typeof taskCreateSchema>;
import {
  mockProjects,
  mockSprints,
  mockUsers,
  projectById,
  type MockTask,
  type MockTaskPriority,
  type MockTaskStatus,
  type MockTaskType,
} from '@/lib/mock/gbm';
import { cn } from '@/lib/utils';

const POINT_OPTIONS = [1, 2, 3, 5, 8, 13];
const TYPES: MockTaskType[] = ['feature', 'bug', 'chore', 'spike', 'epic'];
const PRIORITIES: MockTaskPriority[] = ['low', 'medium', 'high', 'critical'];
const STATUSES: MockTaskStatus[] = ['todo', 'in_progress', 'in_review', 'blocked', 'done'];

export function TaskFormDialog({
  open,
  onOpenChange,
  initial,
  defaultProjectId,
  defaultSprintId,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: MockTask | null;
  defaultProjectId?: string;
  defaultSprintId?: string | null;
  onSave: (task: MockTask) => void;
}) {
  const editing = Boolean(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TaskFormValues, unknown, TaskCreateInput>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: {
      project_id: initial?.project_id ?? defaultProjectId ?? mockProjects[0].id,
      sprint_id: initial?.sprint_id ?? defaultSprintId ?? null,
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      type: initial?.type ?? 'feature',
      priority: initial?.priority ?? 'medium',
      status: initial?.status ?? 'todo',
      story_points: initial?.story_points ?? null,
      assignee_id: initial?.assignee_id ?? null,
      due_date: initial?.due_date ?? null,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        project_id: initial?.project_id ?? defaultProjectId ?? mockProjects[0].id,
        sprint_id: initial?.sprint_id ?? defaultSprintId ?? null,
        title: initial?.title ?? '',
        description: initial?.description ?? '',
        type: initial?.type ?? 'feature',
        priority: initial?.priority ?? 'medium',
        status: initial?.status ?? 'todo',
        story_points: initial?.story_points ?? null,
        assignee_id: initial?.assignee_id ?? null,
        due_date: initial?.due_date ?? null,
      });
      setError(null);
    }
  }, [open, initial, defaultProjectId, defaultSprintId, reset]);

  const projectId = watch('project_id');
  const project = projectById(projectId);
  const sprintsForProject = mockSprints.filter((s) => s.project_id === projectId);
  const teamMembers = project?.members.map((id) => mockUsers.find((u) => u.id === id)!).filter(Boolean) ?? [];
  const watchType = watch('type');
  const watchPriority = watch('priority');
  const watchStatus = watch('status');
  const watchPoints = watch('story_points');
  const watchAssignee = watch('assignee_id');
  const watchSprint = watch('sprint_id');

  async function onSubmit(data: TaskCreateInput) {
    setError(null);
    setSaving(true);
    try {
      const endpoint = editing ? `/api/tasks/${initial?.id}` : '/api/tasks';
      const res = await fetch(endpoint, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        const created: MockTask = json.task ?? toMockTask(data, initial);
        onSave(created);
        onOpenChange(false);
      } else if (res.status === 503) {
        // Mock mode — build the task locally
        const created = toMockTask(data, initial);
        onSave(created);
        onOpenChange(false);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Save failed');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
              T-04 · {editing ? 'Edit task' : 'New task'}
            </div>
            {editing && initial && (
              <Badge variant="gold" className="font-mono">
                {initial.task_key}
              </Badge>
            )}
          </div>
          <DialogTitle>{editing ? 'Edit task' : 'Create a task'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update any field. Changes apply optimistically.'
              : 'Add a task to a project. Assign now or leave it for grooming.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} placeholder="What needs doing?" autoFocus />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              {...register('description')}
              placeholder="Context, acceptance criteria, links..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Project</Label>
              <PillPicker
                items={mockProjects.map((p) => ({ value: p.id, label: p.key, color: p.color }))}
                value={projectId}
                onChange={(v) => {
                  setValue('project_id', v);
                  setValue('sprint_id', null);
                  setValue('assignee_id', null);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Sprint</Label>
              <PillPicker
                items={[
                  { value: '__backlog__', label: 'Backlog' },
                  ...sprintsForProject.map((s) => ({ value: s.id, label: `#${s.sprint_number}` })),
                ]}
                value={watchSprint ?? '__backlog__'}
                onChange={(v) => setValue('sprint_id', v === '__backlog__' ? null : v)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <PillPicker
                items={TYPES.map((t) => ({ value: t, label: t }))}
                value={watchType ?? 'feature'}
                onChange={(v) => setValue('type', v as MockTaskType)}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <PillPicker
                items={PRIORITIES.map((p) => ({ value: p, label: p }))}
                value={watchPriority ?? 'medium'}
                onChange={(v) => setValue('priority', v as MockTaskPriority)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <PillPicker
                items={STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))}
                value={watchStatus ?? 'todo'}
                onChange={(v) => setValue('status', v as MockTaskStatus)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Story points</Label>
              <PillPicker
                items={[{ value: 'null', label: '—' }, ...POINT_OPTIONS.map((p) => ({ value: String(p), label: String(p) }))]}
                value={watchPoints == null ? 'null' : String(watchPoints)}
                onChange={(v) => setValue('story_points', v === 'null' ? null : Number(v))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" type="date" {...register('due_date')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assignee</Label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setValue('assignee_id', null)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors',
                  !watchAssignee
                    ? 'border-gold/50 bg-gold/10 text-foreground'
                    : 'border-border bg-[#0A0A0A] text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="font-mono text-[10px]">Unassigned</span>
              </button>
              {teamMembers.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setValue('assignee_id', u.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors',
                    watchAssignee === u.id
                      ? 'border-gold/50 bg-gold/10 text-foreground'
                      : 'border-border bg-[#0A0A0A] text-muted-foreground hover:text-foreground'
                  )}
                >
                  <OwnerAvatar user={u} size={16} />
                  <span className="text-[12px]">{u.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {!saving && (editing ? <Save className="size-4" /> : <Sparkles className="size-4" />)}
              {editing ? 'Save changes' : 'Create task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PillPicker({
  items,
  value,
  onChange,
}: {
  items: { value: string; label: string; color?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors capitalize',
            value === it.value
              ? 'border-gold/50 bg-gold/10 text-foreground'
              : 'border-border bg-[#0A0A0A] text-muted-foreground hover:text-foreground'
          )}
        >
          {it.color && (
            <span className="size-2 rounded-full" style={{ background: it.color }} aria-hidden />
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.05em]">{it.label}</span>
        </button>
      ))}
    </div>
  );
}

function toMockTask(data: TaskCreateInput, prev?: MockTask | null): MockTask {
  const id = prev?.id ?? `t-new-${Math.random().toString(36).slice(2, 8)}`;
  const project = projectById(data.project_id)!;
  const seq = Math.floor(Math.random() * 900) + 100;
  const key = prev?.task_key ?? `${project.key}-${seq}`;
  return {
    id,
    task_key: key,
    project_id: data.project_id,
    sprint_id: data.sprint_id ?? null,
    title: data.title,
    description: data.description ?? '',
    status: data.status ?? 'todo',
    priority: data.priority ?? 'medium',
    type: data.type ?? 'feature',
    assignee_id: data.assignee_id ?? null,
    reporter_id: prev?.reporter_id ?? 'u-raphy',
    story_points: data.story_points ?? null,
    is_blocked: data.status === 'blocked' ? true : prev?.is_blocked ?? false,
    blocker_reason: prev?.blocker_reason,
    due_date: data.due_date ?? null,
    created_at: prev?.created_at ?? new Date().toISOString(),
    completed_at: data.status === 'done' ? new Date().toISOString() : null,
    comments: prev?.comments ?? [],
  };
}
