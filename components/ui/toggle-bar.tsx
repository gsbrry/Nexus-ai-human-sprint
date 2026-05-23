'use client';
import { cn } from '@/lib/utils';

export function Toggle<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <div className="inline-flex items-center gap-0.5 rounded-md bg-[#0A0A0A] p-0.5 border border-border">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'px-2.5 py-1 rounded-sm font-mono text-[10px] uppercase tracking-[0.1em] transition-colors',
              value === o.value ? 'bg-card text-gold border border-gold/30' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
