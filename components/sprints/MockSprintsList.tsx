import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowUpRight, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import {
  mockSprints,
  projectById,
  tasksForSprint,
  userById,
} from '@/lib/mock/yallo';

export function MockSprintsList() {
  const sprints = [...mockSprints].sort((a, b) => {
    const order = { active: 0, planned: 1, completed: 2, cancelled: 3 } as const;
    return order[a.status] - order[b.status] || a.sprint_number - b.sprint_number;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">T-01 · Sprints</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Sprints</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Every active and planned sprint across your projects.
          </p>
        </div>
        <Link
          href="/sprints/backlog"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-gold hover:border-gold/30 transition-colors"
        >
          <ArrowUpRight className="size-3.5" />
          T-05 · Global backlog
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sprints.map((s) => {
          const project = projectById(s.project_id)!;
          const tasks = tasksForSprint(s.id);
          const totalPts = tasks.reduce((sum, t) => sum + (t.story_points ?? 0), 0);
          const donePts = tasks
            .filter((t) => t.status === 'done')
            .reduce((sum, t) => sum + (t.story_points ?? 0), 0);
          const pct = Math.round((donePts / Math.max(1, totalPts)) * 100);
          const blockers = tasks.filter((t) => t.is_blocked).length;
          const assignees = Array.from(new Set(tasks.map((t) => t.assignee_id).filter(Boolean))).slice(0, 6);

          return (
            <Link key={s.id} href={`/sprints/${s.id}`}>
              <Card className="hover:border-gold/30 transition-colors h-full">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge
                          variant={
                            s.status === 'active'
                              ? 'gold'
                              : s.status === 'completed'
                              ? 'teal'
                              : s.status === 'planned'
                              ? 'blue'
                              : 'default'
                          }
                        >
                          {s.status}
                        </Badge>
                        <span
                          className="font-mono text-[10px] uppercase tracking-[0.1em]"
                          style={{ color: project.color }}
                        >
                          {project.key} · Sprint {s.sprint_number}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-base font-bold">
                        {s.name.split('·')[1]?.trim() ?? s.name}
                        <ArrowUpRight className="size-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-[12px] text-muted-foreground line-clamp-2 mt-1 flex items-start gap-1.5">
                        <Target className="size-3 mt-0.5 shrink-0 text-gold" />
                        {s.goal}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span>
                      {format(new Date(s.start_date), 'dd MMM')} → {format(new Date(s.end_date), 'dd MMM')}
                    </span>
                    <span>
                      {tasks.length} tasks · {totalPts} pts
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground mb-1.5">
                      <span>Burndown</span>
                      <span>
                        {donePts} / {totalPts} pts · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#0A0A0A] border border-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {assignees.map((id) => {
                        const u = userById(id!)!;
                        return (
                          <div key={id} className="ring-2 ring-card rounded-full">
                            <OwnerAvatar user={u} size={22} />
                          </div>
                        );
                      })}
                    </div>
                    {blockers > 0 ? (
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#F09595]">
                        {blockers} blocker{blockers === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        clean
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
