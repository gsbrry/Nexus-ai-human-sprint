import { Activity, ArrowDownRight, ArrowUpRight, Gauge, Sparkles, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VelocityChart } from '@/components/velocity/VelocityChart';
import { MemberVelocityGrid } from '@/components/velocity/MemberVelocityGrid';
import {
  orgAvgVelocity,
  orgCompletionRate,
  orgPredictedNext,
  yalloVelocity,
} from '@/lib/mock/velocity';

export default function VelocityPage() {
  const avg = orgAvgVelocity();
  const predicted = orgPredictedNext();
  const rate = orgCompletionRate();
  const lastCompleted = yalloVelocity[yalloVelocity.length - 2];
  const lastDelta = lastCompleted.points_completed - lastCompleted.points_committed;
  const lastDeltaPct = Math.round((lastCompleted.points_completed / lastCompleted.points_committed) * 100);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">V-01 · Velocity</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Sprint velocity</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Committed vs completed across the last {yalloVelocity.length} sprints. AI Curriculum 2.0.
          </p>
        </div>
        <Badge variant="gold">YALLO · Sprint {yalloVelocity[yalloVelocity.length - 1].sprint_number} active</Badge>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          icon={Gauge}
          label="Avg velocity"
          value={`${avg} pts`}
          sub="last 5 completed"
          tone="gold"
        />
        <Kpi
          icon={TrendingUp}
          label="Predicted next"
          value={`${predicted} pts`}
          sub="weighted 3-sprint"
        />
        <Kpi
          icon={Activity}
          label="Completion rate"
          value={`${rate}%`}
          sub="committed → done"
          tone={rate >= 90 ? 'gold' : rate >= 75 ? undefined : 'red'}
        />
        <Kpi
          icon={lastDelta >= 0 ? ArrowUpRight : ArrowDownRight}
          label={`Last sprint (#${lastCompleted.sprint_number})`}
          value={`${lastCompleted.points_completed} / ${lastCompleted.points_committed}`}
          sub={`${lastDeltaPct}% of plan`}
          tone={lastDeltaPct >= 95 ? 'gold' : lastDeltaPct >= 80 ? undefined : 'red'}
        />
      </div>

      {/* Velocity chart */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Committed vs completed</div>
              <h2 className="text-lg font-bold tracking-tight">Sprint-by-sprint</h2>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#2A2A2A] border border-[#3F3F3F]" />
                Committed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-gold" />
                Completed
              </span>
            </div>
          </div>
          <VelocityChart data={yalloVelocity} />
        </CardContent>
      </Card>

      {/* Insights row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-gold" />
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-gold">Trend</div>
            </div>
            <p className="text-sm text-foreground/85">
              Sprint 11 missed plan (34/52 — 65%) due to reviewer tooling blockers. Last 3 sprints averaged{' '}
              <span className="text-gold font-semibold">
                {Math.round(
                  yalloVelocity
                    .slice(-4, -1)
                    .reduce((s, sp) => s + sp.points_completed, 0) / 3
                )}{' '}
                pts
              </span>{' '}
              — commit confidence rising.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="size-4 text-[#5BC498]" />
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#5BC498]">Active sprint</div>
            </div>
            <p className="text-sm text-foreground/85">
              Sprint 14 day 3 of 14. Committed{' '}
              <span className="font-semibold text-foreground">41 pts</span>, 5 done so far. Projected
              completion <span className="font-semibold text-gold">{predicted} pts</span> based on rolling avg.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="size-4 text-[#A8A2F0]" />
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#A8A2F0]">Team</div>
            </div>
            <p className="text-sm text-foreground/85">
              <span className="font-semibold text-foreground">Marcus</span> and{' '}
              <span className="font-semibold text-foreground">Aria</span> are highest-throughput contributors
              (avg 10+ pts/sprint). Nina ramps up properly from Sprint 3 of the NEXUS build.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* V-02 Member velocity grid */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">V-02 · Member velocity</div>
            <h2 className="text-lg font-bold tracking-tight">Who shipped what</h2>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Last 6 sprints
          </div>
        </div>
        <MemberVelocityGrid />
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone?: 'gold' | 'red';
}) {
  return (
    <Card className="bg-[#0A0A0A]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon
            className={
              'size-3.5 ' +
              (tone === 'gold' ? 'text-gold' : tone === 'red' ? 'text-[#F09595]' : 'text-muted-foreground')
            }
          />
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </div>
        </div>
        <div
          className={
            'font-mono text-[20px] sm:text-[26px] font-extrabold ' +
            (tone === 'gold' ? 'text-gold' : tone === 'red' ? 'text-[#F09595]' : 'text-foreground')
          }
        >
          {value}
        </div>
        {sub && <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}
