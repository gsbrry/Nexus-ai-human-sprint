'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Plus, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export type SprintFormProject = { id: string; key: string; name: string };

export type SprintFormValues = {
  id?: string;
  project_id?: string;
  name?: string;
  goal?: string | null;
  start_date?: string;
  end_date?: string;
  capacity_points?: number | null;
  status?: string;
};

/** Two weeks from today, matching the team's default cadence. */
function defaultDates() {
  const start = new Date();
  const end = new Date(start.getTime() + 13 * 24 * 60 * 60 * 1000);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function SprintFormDialog({
  open,
  onOpenChange,
  projects,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: SprintFormProject[];
  initial?: SprintFormValues | null;
}) {
  const editing = Boolean(initial?.id);
  const router = useRouter();
  const d = defaultDates();

  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState(d.start);
  const [endDate, setEndDate] = useState(d.end);
  const [capacity, setCapacity] = useState('');
  const [startNow, setStartNow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const fresh = defaultDates();
    setProjectId(initial?.project_id ?? projects[0]?.id ?? '');
    setName(initial?.name ?? '');
    setGoal(initial?.goal ?? '');
    setStartDate(initial?.start_date ?? fresh.start);
    setEndDate(initial?.end_date ?? fresh.end);
    setCapacity(initial?.capacity_points != null ? String(initial.capacity_points) : '');
    setStartNow(initial?.status === 'active');
    setError(null);
  }, [open, initial, projects]);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        goal: goal.trim() || null,
        start_date: startDate,
        end_date: endDate,
        capacity_points: capacity ? Number(capacity) : 0,
      };
      if (!editing) {
        body.project_id = projectId;
        body.status = startNow ? 'active' : 'planned';
      } else if (initial?.status === 'planned' && startNow) {
        body.status = 'active';
      }

      const res = await fetch(editing ? `/api/sprints/${initial?.id}` : '/api/sprints', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not save the sprint');

      onOpenChange(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the sprint');
    } finally {
      setSaving(false);
    }
  }

  const valid =
    name.trim().length >= 2 && (editing || projectId) && startDate && endDate && endDate >= startDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            T-01 · {editing ? 'Edit sprint' : 'New sprint'}
          </div>
          <DialogTitle>{editing ? 'Edit sprint' : 'Plan a sprint'}</DialogTitle>
          <DialogDescription>
            A project can have only one active sprint at a time. Complete the current one before
            starting the next.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!editing && (
            <div className="space-y-1.5">
              <Label>Project</Label>
              <div className="flex flex-wrap gap-2">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProjectId(p.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors',
                      projectId === p.id
                        ? 'border-primary/50 bg-primary/10 text-foreground'
                        : 'border-border bg-[#0A0A0A] text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="font-mono text-[10px] font-bold">{p.key}</span>
                    <span className="text-[12px]">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="sprint_name">Name</Label>
            <Input
              id="sprint_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sprint 6 · Notifications"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sprint_goal">Goal</Label>
            <Textarea
              id="sprint_goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              placeholder="What does done look like for this sprint?"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sprint_start">Start</Label>
              <Input
                id="sprint_start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sprint_end">End</Label>
              <Input
                id="sprint_end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sprint_capacity">Capacity</Label>
              <Input
                id="sprint_capacity"
                type="number"
                min={0}
                max={999}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="pts"
                className="font-mono"
              />
            </div>
          </div>

          {endDate < startDate && (
            <p className="text-[12px] text-[#F09595]">End date must be on or after the start date.</p>
          )}

          {(!editing || initial?.status === 'planned') && (
            <button
              type="button"
              onClick={() => setStartNow((v) => !v)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors',
                startNow ? 'border-primary/50 bg-primary/10' : 'border-border bg-[#0A0A0A]'
              )}
            >
              <CheckCircle2
                className={cn('size-4', startNow ? 'text-primary' : 'text-muted-foreground')}
              />
              <span className="text-[12px]">
                Start this sprint immediately
                <span className="block text-[11px] text-muted-foreground">
                  Otherwise it is created as planned, and you start it later.
                </span>
              </span>
            </button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : editing ? (
              <Save className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            {editing ? 'Save sprint' : 'Create sprint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Client trigger for the button that lives inside a server component. */
export function NewSprintButton({ projects }: { projects: SprintFormProject[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} disabled={projects.length === 0}>
        <Plus className="size-4" />
        New sprint
      </Button>
      <SprintFormDialog open={open} onOpenChange={setOpen} projects={projects} />
    </>
  );
}
