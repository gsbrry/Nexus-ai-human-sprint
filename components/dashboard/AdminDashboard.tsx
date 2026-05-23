import Link from 'next/link';
import { ArrowUpRight, Building2, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import {
  activeSprintForProject,
  mockProjects,
  mockTasks,
  mockUsers,
  tasksForProject,
  userById,
} from '@/lib/mock/yallo';

export function AdminDashboard() {
  const projects = mockProjects;
  const totalTasks = mockTasks.length;
  const openTasks = mockTasks.filter((t) => t.status !== 'done').length;
  const blockers = mockTasks.filter((t) => t.is_blocked).length;
  const aiUpdates = mockTasks.reduce((s, t) => s + t.comments.filter((c) => c.source === 'ai_agent').length, 0);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">D-03 · Org admin dashboard</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">YALLO Academy</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Org-wide health across {projects.length} active projects and {mockUsers.length} members.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Projects" value={projects.length.toString()} sub="all active" />
        <Stat label="Members" value={mockUsers.length.toString()} sub="3 roles" />
        <Stat label="Open tasks" value={openTasks.toString()} sub={`${totalTasks} total`} />
        <Stat
          label="Blockers"
          value={blockers.toString()}
          sub={blockers ? 'org-wide' : 'clean'}
          tone={blockers ? 'red' : undefined}
        />
      </div>

      {/* Project grid */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Projects</div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              Across the org
            </h2>
          </div>
          <Link
            href="/projects"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-gold"
          >
            All projects →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map((p) => {
            const tasks = tasksForProject(p.id);
            const sprint = activeSprintForProject(p.id);
            const open = tasks.filter((t) => t.status !== 'done').length;
            const blocked = tasks.filter((t) => t.is_blocked).length;
            const points = tasks.reduce((s, t) => s + (t.story_points ?? 0), 0);
            const donePts = tasks.filter((t) => t.status === 'done').reduce((s, t) => s + (t.story_points ?? 0), 0);
            return (
              <Link key={p.id} href={`/projects/${p.key.toLowerCase()}`}>
                <Card className="h-full hover:border-gold/30 transition-colors">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="size-10 shrink-0 rounded-md border flex items-center justify-center font-mono text-[11px] font-bold"
                        style={{ color: p.color, background: `${p.color}22`, borderColor: `${p.color}55` }}
                      >
                        {p.key}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold truncate">{p.name}</h3>
                          <ArrowUpRight className="size-3.5 text-muted-foreground" />
                        </div>
                        <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{p.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <Mini label="Open" value={open.toString()} />
                      <Mini label="Done pts" value={donePts.toString()} tone="gold" />
                      <Mini label="Total pts" value={points.toString()} />
                      <Mini label="Blocked" value={blocked.toString()} tone={blocked ? 'red' : undefined} />
                    </div>
                    {sprint && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
                        <Badge variant="gold">Sprint {sprint.sprint_number}</Badge>
                        <span className="text-[11px] text-muted-foreground truncate">{sprint.goal}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-[#7F77DD]/30 bg-[#7F77DD]/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-[#A8A2F0]" />
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#A8A2F0]">AI agent activity</div>
            </div>
            <div className="font-mono text-[26px] font-extrabold text-[#A8A2F0]">{aiUpdates}</div>
            <p className="text-[12px] text-muted-foreground mt-1">
              AI agent updates posted across all tasks. Cost ledger lands in Sprint 4 with the ai_interactions schema.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-4 text-gold" />
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-gold">Velocity (org avg)</div>
            </div>
            <div className="font-mono text-[26px] font-extrabold text-gold">42 pts</div>
            <p className="text-[12px] text-muted-foreground mt-1">
              Per-sprint rolling average across the last 3 completed sprints. Real chart lands in Sprint 3 (Recharts).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members table */}
      <div className="space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Members</div>
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:grid grid-cols-[1fr_160px_120px_100px] gap-3 px-4 py-2.5 bg-[#0A0A0A] border-b border-border font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div className="text-right">Open tasks</div>
            </div>
            {mockUsers.map((u) => {
              const open = mockTasks.filter((t) => t.assignee_id === u.id && t.status !== 'done').length;
              return (
                <div
                  key={u.id}
                  className="grid grid-cols-[1fr_100px] md:grid-cols-[1fr_160px_120px_100px] gap-3 px-4 py-3 border-b border-border last:border-b-0 items-center"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <OwnerAvatar user={u} size={26} />
                    <span className="text-[13px] font-medium truncate">{u.name}</span>
                  </div>
                  <div className="hidden md:block text-[12px] text-muted-foreground truncate">{u.email}</div>
                  <div className="hidden md:block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {u.role.replace('_', ' ')}
                  </div>
                  <div className="font-mono text-[12px] text-right">{open}</div>
                </div>
              );
            })}
          </CardContent>
        </Card>
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

function Mini({ label, value, tone }: { label: string; value: string; tone?: 'gold' | 'red' }) {
  void userById; // keep tree-shake-friendly import; not strictly used here
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div
        className={
          'font-mono text-[15px] font-extrabold ' +
          (tone === 'gold' ? 'text-gold' : tone === 'red' ? 'text-[#F09595]' : 'text-foreground')
        }
      >
        {value}
      </div>
    </div>
  );
}
