import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowUpRight, Target, Users, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { TaskList } from '@/components/tasks/TaskList';
import {
  activeSprintForProject,
  mockProjects,
  mockUsers,
  tasksAssignedTo,
  tasksForSprint,
} from '@/lib/mock/gbm';

export function SmDashboard() {
  const gbm = mockProjects[0];
  const sprint = activeSprintForProject(gbm.id)!;
  const sprintTasks = tasksForSprint(sprint.id);
  const totalPoints = sprintTasks.reduce((s, t) => s + (t.story_points ?? 0), 0);
  const donePoints = sprintTasks.filter((t) => t.status === 'done').reduce((s, t) => s + (t.story_points ?? 0), 0);
  const blockers = sprintTasks.filter((t) => t.is_blocked);

  // Per-member capacity in this sprint
  const capacity = gbm.members
    .map((id) => {
      const u = mockUsers.find((m) => m.id === id);
      if (!u) return null;
      const tasks = sprintTasks.filter((t) => t.assignee_id === id);
      const open = tasks.filter((t) => t.status !== 'done');
      const points = tasks.reduce((s, t) => s + (t.story_points ?? 0), 0);
      const donePts = tasks.filter((t) => t.status === 'done').reduce((s, t) => s + (t.story_points ?? 0), 0);
      return { user: u, open: open.length, total: tasks.length, points, donePts };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => b.points - a.points);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">D-02 · Scrum master dashboard</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Sprint health</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Team capacity, blockers, and what to clear before stand-up.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="Sprint" value={`#${sprint.sprint_number}`} sub={sprint.name.split('·')[1]?.trim() ?? ''} />
        <Mini label="Committed" value={`${totalPoints} pts`} sub={`${sprintTasks.length} tasks`} />
        <Mini
          label="Done"
          value={`${donePoints} pts`}
          sub={`${Math.round((donePoints / Math.max(1, totalPoints)) * 100)}% of plan`}
          tone="gold"
        />
        <Mini label="Blockers" value={blockers.length.toString()} sub="needs unblocking" tone={blockers.length ? 'red' : undefined} />
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="gold">Active sprint</Badge>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {format(new Date(sprint.start_date), 'dd MMM')} →{' '}
                  {format(new Date(sprint.end_date), 'dd MMM')}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">{sprint.name}</h2>
              <p className="text-sm text-muted-foreground mt-1 flex items-start gap-2">
                <Target className="size-4 text-gold shrink-0 mt-0.5" />
                {sprint.goal}
              </p>
            </div>
            <Link
              href={`/projects/${gbm.key.toLowerCase()}`}
              className="shrink-0 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-gold hover:text-gold-light"
            >
              Open project <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div>
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-2">
              <span>Burndown</span>
              <span>
                {donePoints} / {totalPoints} pts
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#0A0A0A] border border-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                style={{ width: `${Math.min(100, (donePoints / Math.max(1, totalPoints)) * 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team capacity */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Team capacity</div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              Who has what
            </h2>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {capacity.length} members
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {capacity.map((c) => {
            const pct = Math.round((c.donePts / Math.max(1, c.points)) * 100);
            return (
              <Card key={c.user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <OwnerAvatar user={c.user} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold truncate">{c.user.name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        {c.user.role.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[16px] font-extrabold">{c.points}</div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">pts</div>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#0A0A0A] border border-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 font-mono text-[10px] text-muted-foreground">
                    <span>{c.open} open</span>
                    <span>{c.donePts} done</span>
                    <span className={c.open === 0 && c.total > 0 ? 'text-gold' : ''}>{pct}%</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Blockers full list */}
      {blockers.length > 0 && (
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F09595]">Blockers</div>
          <TaskList tasks={blockers} />
        </div>
      )}

      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        <Calendar className="size-3.5" />
        Stand-up at 09:00. {blockers.length} blockers to call out.
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'gold' | 'red';
}) {
  return (
    <Card className="bg-[#0A0A0A]">
      <CardContent className="p-4 sm:p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
        <div
          className={
            'font-mono text-[20px] sm:text-[26px] font-extrabold mt-1 ' +
            (tone === 'gold' ? 'text-gold' : tone === 'red' ? 'text-[#F09595]' : 'text-foreground')
          }
        >
          {value}
        </div>
        {sub && <div className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</div>}
      </CardContent>
    </Card>
  );
}
