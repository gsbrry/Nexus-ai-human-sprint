import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowUpRight, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrg } from '@/lib/server/feature-flag';
import { EmptyOrgPrompt } from '@/components/setup/EmptyOrgPrompt';

export async function RealProjectsList() {
  const active = await getActiveOrg();
  if (!active?.org_id) return <EmptyOrgPrompt />;

  const supabase = createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, key, name, description, status, color, start_date, target_date, created_at')
    .eq('org_id', active.org_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  // Per-project task counts in one query
  const { data: taskRows } = await supabase
    .from('tasks')
    .select('project_id, status, is_blocked')
    .eq('org_id', active.org_id)
    .is('deleted_at', null);

  const counts: Record<string, { open: number; done: number; blockers: number }> = {};
  for (const t of taskRows ?? []) {
    const pid = t.project_id as string;
    if (!counts[pid]) counts[pid] = { open: 0, done: 0, blockers: 0 };
    if (t.status === 'done') counts[pid].done++;
    else counts[pid].open++;
    if (t.is_blocked && t.status !== 'done') counts[pid].blockers++;
  }

  // Active sprint per project
  const { data: sprints } = await supabase
    .from('sprints')
    .select('id, name, sprint_number, goal, start_date, end_date, project_id')
    .eq('org_id', active.org_id)
    .eq('status', 'active');

  type SprintRow = NonNullable<typeof sprints>[number];
  const sprintByProject: Record<string, SprintRow> = {};
  for (const s of sprints ?? []) sprintByProject[s.project_id as string] = s;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            P-01 · Projects
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">All projects in your organisation.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="gold" className="font-mono">Real DB</Badge>
          <Button size="sm">
            <Plus className="size-4" />
            New project
          </Button>
        </div>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-6 py-16 text-center space-y-3">
          <div className="text-sm text-muted-foreground">No projects yet.</div>
          <p className="text-[12px] text-muted-foreground">Seed the demo workspace or create your first project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((p) => {
            const c = counts[p.id] ?? { open: 0, done: 0, blockers: 0 };
            const sprint = sprintByProject[p.id];
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="hover:border-primary/30 transition-colors h-full">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="size-10 rounded-md border flex items-center justify-center font-mono text-[11px] font-bold shrink-0"
                        style={{ color: p.color ?? '#888', background: `${p.color ?? '#222'}22`, borderColor: `${p.color ?? '#444'}55` }}
                      >
                        {p.key}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold truncate">{p.name}</h3>
                          <ArrowUpRight className="size-3.5 text-muted-foreground" />
                        </div>
                        {p.description && (
                          <p className="text-[12px] text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Mini label="Open" value={c.open.toString()} />
                      <Mini label="Done" value={c.done.toString()} />
                      <Mini label="Blockers" value={c.blockers.toString()} tone={c.blockers ? 'red' : undefined} />
                    </div>
                    {sprint && (
                      <div className="rounded-md border border-border bg-[#0A0A0A] px-3 py-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="gold" className="font-mono">Sprint {sprint.sprint_number}</Badge>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {format(new Date(sprint.start_date), 'dd MMM')} → {format(new Date(sprint.end_date), 'dd MMM')}
                          </span>
                        </div>
                        {sprint.goal && (
                          <div className="text-[12px] text-muted-foreground mt-1.5 line-clamp-1">{sprint.goal}</div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: 'red' }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className={'font-mono text-[20px] font-extrabold ' + (tone === 'red' ? 'text-destructive' : 'text-foreground')}>
        {value}
      </div>
    </div>
  );
}
