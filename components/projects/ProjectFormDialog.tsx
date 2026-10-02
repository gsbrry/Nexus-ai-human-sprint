'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Save } from 'lucide-react';
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

export type ProjectFormValues = {
  id?: string;
  name: string;
  key: string;
  description?: string | null;
  color?: string | null;
  start_date?: string | null;
  target_date?: string | null;
};

const SWATCHES = ['#1a73e8', '#1D9E75', '#7F77DD', '#EF9F27', '#E24B4A', '#639922', '#AAAAAA'];

/**
 * P-03. Creates a project, or edits one.
 *
 * The project key is immutable after creation: every task_key already embeds it,
 * so changing it would orphan the identifiers people quote in standups.
 */
export function ProjectFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ProjectFormValues | null;
}) {
  const editing = Boolean(initial?.id);
  const router = useRouter();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(SWATCHES[0]);
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setKey(initial?.key ?? '');
    setKeyTouched(Boolean(initial?.key));
    setDescription(initial?.description ?? '');
    setColor(initial?.color ?? SWATCHES[0]);
    setStartDate(initial?.start_date ?? '');
    setTargetDate(initial?.target_date ?? '');
    setError(null);
  }, [open, initial]);

  /** Suggest a key from the name until the user types their own. */
  function onNameChange(v: string) {
    setName(v);
    if (keyTouched || editing) return;
    const suggestion = v
      .replace(/[^A-Za-z0-9 ]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 5);
    setKey(suggestion);
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || null,
        color,
        start_date: startDate || null,
        target_date: targetDate || null,
      };
      if (!editing) body.key = key.trim().toUpperCase();

      const res = await fetch(editing ? `/api/projects/${initial?.id}` : '/api/projects', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not save the project');

      onOpenChange(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the project');
    } finally {
      setSaving(false);
    }
  }

  const valid = name.trim().length >= 2 && (editing || /^[A-Za-z][A-Za-z0-9]{1,9}$/.test(key.trim()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            P-03 · {editing ? 'Edit project' : 'New project'}
          </div>
          <DialogTitle>{editing ? 'Edit project' : 'Create a project'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update the details. The project key cannot change, because task IDs are built from it.'
              : 'The key prefixes every task ID in this project, for example NXS-14.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="project_name">Name</Label>
              <Input
                id="project_name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Nexus platform"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project_key">Key</Label>
              <Input
                id="project_key"
                value={key}
                disabled={editing}
                onChange={(e) => {
                  setKeyTouched(true);
                  setKey(e.target.value.toUpperCase());
                }}
                placeholder="NXS"
                className="font-mono uppercase"
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project_description">Description</Label>
            <Textarea
              id="project_description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this project for?"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Colour</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Use colour ${c}`}
                  className={cn(
                    'size-7 rounded-full border-2 transition-transform',
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Start date</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target_date">Target date</Label>
              <Input
                id="target_date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>
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
            {editing ? 'Save project' : 'Create project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Client trigger for the button that lives inside a server component. */
export function NewProjectButton({ size = 'sm' }: { size?: 'sm' | 'default' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New project
      </Button>
      <ProjectFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
