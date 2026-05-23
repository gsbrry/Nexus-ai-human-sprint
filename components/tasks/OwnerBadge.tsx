import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MockUser } from '@/lib/mock/yallo';

export function OwnerBadge({ user, className }: { user: MockUser | undefined; className?: string }) {
  if (!user) {
    return (
      <Badge variant="default" className={cn(className)}>
        Unassigned
      </Badge>
    );
  }
  return (
    <Badge variant={user.color} className={cn(className)}>
      {user.name.split(' ')[0]}
    </Badge>
  );
}

export function OwnerAvatar({ user, size = 24 }: { user: MockUser | undefined; size?: number }) {
  const colorMap: Record<string, string> = {
    gold: 'bg-gold/25 text-gold',
    blue: 'bg-[#378ADD]/25 text-[#7AB4EA]',
    teal: 'bg-[#1D9E75]/25 text-[#5BC498]',
    purple: 'bg-[#7F77DD]/25 text-[#A8A2F0]',
    red: 'bg-[#E24B4A]/25 text-[#F09595]',
    amber: 'bg-[#EF9F27]/25 text-[#F2BB6B]',
    green: 'bg-[#639922]/25 text-[#9FCC58]',
  };
  const cls = user ? colorMap[user.color] : 'bg-card text-muted-foreground';
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold border border-border',
        cls
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.4) }}
      title={user?.name}
    >
      {user?.initials ?? '?'}
    </div>
  );
}
