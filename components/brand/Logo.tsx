import { cn } from '@/lib/utils';

export function Logo({ className, showSub = true }: { className?: string; showSub?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="h-9 w-9 rounded-md border-[1.5px] border-gold flex items-center justify-center text-gold font-mono text-[13px] font-bold">
        N
      </div>
      <div className="leading-tight">
        <div className="text-[17px] font-bold tracking-tight">NEXUS</div>
        {showSub && (
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            AI-era project management
          </div>
        )}
      </div>
    </div>
  );
}

export function GoldStrip() {
  return (
    <div
      className="h-[3px] w-full"
      style={{
        background: 'linear-gradient(90deg, #1a73e8 0%, #4a90e8 50%, transparent 100%)',
      }}
    />
  );
}
