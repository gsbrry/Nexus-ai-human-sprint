'use client';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SectionHeader({
  code,
  title,
  desc,
}: {
  code: string;
  title: string;
  desc?: string;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{code}</div>
      <div className="text-base font-bold tracking-tight">{title}</div>
      {desc && <p className="text-[12px] text-muted-foreground mt-1 max-w-[640px]">{desc}</p>}
    </div>
  );
}

/** Inline result line shared by every tab's save action. */
export function StatusLine({ state }: { state: { kind: 'ok' | 'error'; message: string } | null }) {
  if (!state) return null;
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-[12px]',
        state.kind === 'ok' ? 'text-[#5BC498]' : 'text-[#F09595]'
      )}
    >
      {state.kind === 'ok' ? (
        <CheckCircle2 className="size-3.5" />
      ) : (
        <AlertTriangle className="size-3.5" />
      )}
      {state.message}
    </div>
  );
}

export type SaveState = { kind: 'ok' | 'error'; message: string } | null;

export function LoadingPanel({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="rounded-md border border-dashed border-border px-6 py-10 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
      {label}
    </div>
  );
}
