import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { Sparkline } from '@/components/velocity/Sparkline';
import { mockUsers } from '@/lib/mock/yallo';
import { memberStats } from '@/lib/mock/velocity';
import { cn } from '@/lib/utils';

const COLOR_BY: Record<string, string> = {
  gold: '#D4A843',
  blue: '#378ADD',
  teal: '#1D9E75',
  purple: '#7F77DD',
  red: '#E24B4A',
  amber: '#EF9F27',
  green: '#639922',
};

export function MemberVelocityGrid() {
  const cards = mockUsers
    .map((u) => memberStats(u.id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {cards.map((m) => {
        const finished = m.series.slice(0, -1); // exclude active sprint
        const last = finished[finished.length - 1] ?? 0;
        const prev = finished[finished.length - 2] ?? 0;
        const delta = last - prev;
        const arrow = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
        const ArrowIcon = arrow;
        const deltaTone =
          delta > 0 ? 'text-[#5BC498]' : delta < 0 ? 'text-[#F09595]' : 'text-muted-foreground';
        const color = COLOR_BY[m.user.color] ?? '#D4A843';

        return (
          <Card key={m.user.id} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <OwnerAvatar user={m.user} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold truncate">{m.user.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {m.user.role.replace('_', ' ')}
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                    avg / sprint
                  </div>
                  <div className="font-mono text-[22px] font-extrabold" style={{ color }}>
                    {m.avg}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                    last
                  </div>
                  <div
                    className={cn(
                      'font-mono text-[14px] font-extrabold inline-flex items-center gap-1',
                      deltaTone
                    )}
                  >
                    <ArrowIcon className="size-3.5" />
                    {last}
                  </div>
                </div>
              </div>
              <div className="-mx-1">
                <Sparkline data={m.series} color={color} height={42} />
              </div>
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <span>{m.total} pts · 6 sprints</span>
                <span
                  className={
                    delta > 0
                      ? 'text-[#5BC498]'
                      : delta < 0
                      ? 'text-[#F09595]'
                      : 'text-muted-foreground'
                  }
                >
                  {delta > 0 ? '+' : ''}
                  {delta} vs prev
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
