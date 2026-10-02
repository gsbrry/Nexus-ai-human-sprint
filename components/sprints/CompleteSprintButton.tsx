'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Closes a sprint: writes the velocity snapshot, returns unfinished work to the
 * backlog, and notifies the workspace. Confirmed first, because it is the one
 * action in the sprint view that moves other people's tasks.
 */
export function CompleteSprintButton({
  sprintId,
  openTaskCount,
}: {
  sprintId: string;
  openTaskCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function complete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sprints/${sprintId}/complete`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not complete the sprint');
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not complete the sprint');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <CheckCircle2 className="size-4" />
        Complete sprint
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Complete this sprint?</DialogTitle>
            <DialogDescription>
              The velocity snapshot is written now and cannot be recalculated later.
              {openTaskCount > 0
                ? ` ${openTaskCount} unfinished task${openTaskCount === 1 ? '' : 's'} will return to the backlog.`
                : ' Every task is done.'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={complete} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Complete sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
