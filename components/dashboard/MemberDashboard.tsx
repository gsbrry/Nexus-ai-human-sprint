import Link from 'next/link';
import { format } from 'date-fns';
import { AlertTriangle, ArrowUpRight, Calendar, Sparkles, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskList } from '@/components/tasks/TaskList';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import {
  CURRENT_USER_ID,
  activeSprintForProject,
  mockProjects,
  mockTasks,
  tasksAssignedTo,
  tasksForSprint,
  userById,
} from '@/lib/mock/gbm';
import { isAuthConfigured } from '@/lib/auth-config';

export function MemberDashboard() {
  const me = userById(CURRENT_USER_ID)!;
  const gbm = mockProjects[0];
  const sprint = activeSprintForProject(gbm.id)!;
  const sprintTasks = tasksForSprint(sprint.id);
  const myTasks = tasksAssignedTo(CURRENT_USER_ID).filter((t) => t.status !== 'done').slice(0, 5);

  const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points ?? 0), 0);
  const donePoints = sprintTasks.filter((t) => t.status === 'done').reduce((s, t) => s + (t.story_points ?? 0), 0);
  const blockers = sprintTasks.filter((t) => t.is_blocked);
  const openTasks = mockTasks.filter((t) => t.status !== 'done').length;

  const endDate = new Date(sprint.end_date);
  const startDate = new Date(sprint.start_date);
  const today = new Date('2025-06-11');
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));
  const elapsed = Math.max(0, Math.round((today.getTime() - startDate.getTime()) / 86400000));
  const daysLeft = Math.max(0, totalDays - elapsed);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
      {!isAuthConfigured() && (
        <div className="rounded-lg border border-gold/30 bg-gold/5 px-4 sm:px-5 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-1">Preview mode</div>
          <p className="text-[12px] text-muted-foreground">
            GBM mock data is rendered below. Real Supabase queries activate once{' '}
            <code className="font-mono text-gold">.env.local</code> is set and migrations are run.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">D-01 · Member dashboard</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Hey {me.name.split(' ')[0]}.</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {sprint.name.split('·')[1]?.trim() || sprint.name} — day {elapsed} of {totalDays}. {daysLeft} days remaining.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Active sprint" value={`Sprint ${sprint.sprint_number}`} sub={`${daysLeft}d left`} />
        <Stat label="Open tasks" value={openTasks.toString()} sub={`${sprintTasks.length} this sprint`} />
        <Stat
          label="Blockers"
          value={blockers.length.toString()}
          sub={blockers.length ? 'needs attention' : 'none'}
          tone={blockers.length ? 'red' : undefined}
        />
        <Stat
          label="Points done"
          value={`${donePoints}/${totalPoints}`}
          sub={`${Math.round((donePoints / Math.max(1, totalPoints)) * 100)}% complete`}
          tone="gold"
        />
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 sm:gap-6 mb-5 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="gold">Active sprint</Badge>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {format(startDate, 'dd MMM')} → {format(endDate, 'dd MMM')}
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">T-06 · My tasks</div>
              <h2 className="text-lg font-bold tracking-tight">What’s on you</h2>
            </div>
            <Link
              href="/tasks"
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-gold"
            >
              See all →
            </Link>
          </div>
          <TaskList tasks={myTasks} emptyMessage="Inbox zero. Take a breath." />
        </div>

        <aside className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Crew</div>
          <Card>
            <CardContent className="p-4 space-y-3">
              {gbm.members.slice(0, 6).map((id) => {
                const u = userById(id)!;
                const onTasks = tasksAssignedTo(id).filter((t) => t.status !== 'done').length;
                return (
                  <div key={id} className="flex items-center gap-3">
                    <OwnerAvatar user={u} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium truncate">{u.name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        {u.role.replace('_', ' ')}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-muted-foreground shrink-0">{onTasks} open</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {blockers.length > 0 && (
            <Card className="border-[#E24B4A]/30 bg-[#E24B4A]/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="size-4 text-[#F09595]" />
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#F09595]">
                    Blockers · {blockers.length}
                  </div>
                </div>
                <ul className="space-y-2">
                  {blockers.map((t) => (
                    <li key={t.id} className="text-[12px]">
                      <span className="font-mono text-[10px] text-[#F09595] mr-1">{t.task_key}</span>
                      {t.title}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="border-[#7F77DD]/30 bg-[#7F77DD]/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="size-4 text-[#A8A2F0]" />
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#A8A2F0]">AI agent activity</div>
              </div>
              <p className="text-[12px] text-muted-foreground">
                {sprintTasks.flatMap((t) => t.comments.filter((c) => c.source === 'ai_agent')).length} AI updates posted this sprint. Open any task to see them in the comments thread.
              </p>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            <Calendar className="size-3.5" />
            Today · {format(today, 'dd MMM yyyy')}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({
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
        {sub && <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}
