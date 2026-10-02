import { Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BoardUser } from '@/lib/board';

export function OwnerBadge({ user, className }: { user: BoardUser | undefined; className?: string }) {
  if (!user) {
    return (
      <Badge variant="default" className={cn(className)}>
        Unassigned
      </Badge>
    );
  }
  return (
    <Badge variant={user.kind === 'ai_agent' ? 'purple' : user.color} className={cn(className)}>
      {user.kind === 'ai_agent' && <Bot className="size-2.5 mr-1" />}
      {user.name.split(' ')[0]}
    </Badge>
  );
}

export function OwnerAvatar({ user, size = 24 }: { user: BoardUser | undefined; size?: number }) {
  const colorMap: Record<string, string> = {
    gold: 'bg-gold/25 text-gold',
    blue: 'bg-[#378ADD]/25 text-[#7AB4EA]',
    teal: 'bg-[#1D9E75]/25 text-[#5BC498]',
    purple: 'bg-[#7F77DD]/25 text-[#A8A2F0]',
    red: 'bg-[#E24B4A]/25 text-[#F09595]',
    amber: 'bg-[#EF9F27]/25 text-[#F2BB6B]',
    green: 'bg-[#639922]/25 text-[#9FCC58]',
  };
  const isAgent = user?.kind === 'ai_agent';
  const cls = user ? colorMap[user.color] ?? colorMap.purple : 'bg-card text-muted-foreground';

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold border',
        cls,
        // Agents get a dashed ring, so a glance at the board separates the
        // machine-owned cards from the human-owned ones without reading names.
        isAgent ? 'border-dashed border-[#A8A2F0]/70' : 'border-border',
        isAgent && user?.status === 'paused' && 'opacity-50'
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.4) }}
      title={isAgent ? `${user?.name} · AI agent` : user?.name}
    >
      {isAgent && size >= 24 ? (
        <Bot style={{ width: size * 0.5, height: size * 0.5 }} aria-hidden />
      ) : (
        user?.initials ?? '?'
      )}
    </div>
  );
}
