import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import {
  activeSprintForProject,
  mockProjects,
  tasksForProject,
  userById,
} from '@/lib/mock/gbm';

export function MockProjectsList() {
  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">P-01 · Projects</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">All projects in your organisation.</p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {mockProjects.length} active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockProjects.map((p) => {
          const sprint = activeSprintForProject(p.id);
          const tasks = tasksForProject(p.id);
          const open = tasks.filter((t) => t.status !== 'done').length;
          const done = tasks.length - open;
          const blockers = tasks.filter((t) => t.is_blocked).length;
          return (
            <Link key={p.id} href={`/projects/${p.key.toLowerCase()}`}>
              <Card className="hover:border-gold/30 transition-colors h-full">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="size-10 rounded-md border border-border flex items-center justify-center font-mono text-[11px] font-bold"
                      style={{ color: p.color, background: `${p.color}22`, borderColor: `${p.color}55` }}
                    >
                      {p.key}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold truncate">{p.name}</h3>
                        <ArrowUpRight className="size-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-[12px] text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Mini label="Open" value={open.toString()} />
                    <Mini label="Done" value={done.toString()} />
                    <Mini label="Blockers" value={blockers.toString()} tone={blockers ? 'red' : undefined} />
                  </div>

                  {sprint && (
                    <div className="rounded-md border border-border bg-[#0A0A0A] px-3 py-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="gold">Sprint {sprint.sprint_number}</Badge>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {format(new Date(sprint.start_date), 'dd MMM')} →{' '}
                          {format(new Date(sprint.end_date), 'dd MMM')}
                        </span>
                      </div>
                      <div className="text-[12px] text-muted-foreground mt-1.5 line-clamp-1">{sprint.goal}</div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {p.members.slice(0, 5).map((id) => {
                        const u = userById(id)!;
                        return (
                          <div key={id} className="ring-2 ring-card rounded-full">
                            <OwnerAvatar user={u} size={24} />
                          </div>
                        );
                      })}
                      {p.members.length > 5 && (
                        <div className="size-6 rounded-full ring-2 ring-card border border-border bg-[#0A0A0A] flex items-center justify-center font-mono text-[10px] text-muted-foreground">
                          +{p.members.length - 5}
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      Active
                    </span>
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

function Mini({ label, value, tone }: { label: string; value: string; tone?: 'red' }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className={'font-mono text-[20px] font-extrabold ' + (tone === 'red' ? 'text-[#F09595]' : 'text-foreground')}>
        {value}
      </div>
    </div>
  );
}
