'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Sparkles, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function SeedDemoButton() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | { projects: number; sprints: number; tasks: number }>(
    null
  );

  async function seed() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/setup/seed', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setDone({ projects: json.projects, sprints: json.sprints, tasks: json.tasks });
      // Soft-refresh the server component once Supabase has had a moment to settle.
      setTimeout(() => startTransition(() => router.refresh()), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <Alert className="border-primary/30 bg-primary/[0.05]">
        <CheckCircle2 className="size-4 text-primary" />
        <AlertTitle>Demo data seeded</AlertTitle>
        <AlertDescription className="font-mono text-[11px]">
          {done.projects} projects · {done.sprints} sprints · {done.tasks} tasks. Refreshing the
          dashboard…
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertTitle>Seed failed</AlertTitle>
          <AlertDescription className="font-mono text-[11px]">{error}</AlertDescription>
        </Alert>
      )}
      <Button className="w-full" onClick={seed} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {pending ? 'Seeding…' : 'Seed demo data'}
      </Button>
    </div>
  );
}
