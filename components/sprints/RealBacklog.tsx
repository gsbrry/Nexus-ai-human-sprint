import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrg } from '@/lib/server/feature-flag';
import { EmptyOrgPrompt } from '@/components/setup/EmptyOrgPrompt';

type Task = {
  id: string;
  task_key: string;
  title: string;
  status: string;
  priority: string;
  story_points: number | null;
  is_blocked: boolean;
  project_id: string;
};

type Project = { id: string; key: string; name: string; color: string | null };

export async function RealBacklog() {
  const active = await getActiveOrg();
  if (!active?.org_id) return <EmptyOrgPrompt />;

  const supabase = createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, key, name, color')
    .eq('org_id', active.org_id)
    .is('deleted_at', null);
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, task_key, title, status, priority, story_points, is_blocked, project_id')
    .eq('org_id', active.org_id)
    .is('deleted_at', null)
    .is('sprint_id', null);
  const taskList = (tasks ?? []) as Task[];
  const projectList = (projects ?? []) as Project[];

  const byProject: Record<string, { project: Project; tasks: Task[]; pts: number }> = {};
  for (const t of taskList) {
    const p = projectList.find((x) => x.id === t.project_id);
    if (!p) continue;
    if (!byProject[p.id]) byProject[p.id] = { project: p, tasks: [], pts: 0 };
    byProject[p.id].tasks.push(t);
    byProject[p.id].pts += t.story_points ?? 0;
  }

  const totalPts = taskList.reduce((s, t) => s + (t.story_points ?? 0), 0);
  const criticalCount = taskList.filter((t) => t.priority === 'critical').length;

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <Link
        href="/sprints"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        All sprints
      </Link>

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">T-05 · Backlog</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Backlog</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-[640px]">
            Every task across every project that hasn&apos;t been pulled into a sprint yet.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em]">
          <Badge variant="gold" className="font-mono">Real DB</Badge>
          <Badge variant="default">{taskList.length} tasks</Badge>
          <Badge variant="gold">{totalPts} pts</Badge>
          {criticalCount > 0 && <Badge variant="red">{criticalCount} critical</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {projectList.map((p) => {
          const r = byProject[p.id] ?? { tasks: [], pts: 0 };
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: p.color ?? '#666' }} />
                <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: p.color ?? '#888' }}>{p.key}</span>
              </div>
              <div className="mt-2 text-[13px] font-semibold line-clamp-1">{p.name}</div>
              <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <span>{r.tasks.length} tasks</span>
                <span className="text-primary">{r.pts} pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(byProject).length === 0 ? (
        <Card>
          <CardContent className="px-6 py-16 text-center text-sm text-muted-foreground">
            Backlog is empty.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.values(byProject).map(({ project: p, tasks: ts }) => (
            <section key={p.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: p.color ?? '#666' }} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: p.color ?? '#888' }}>{p.key}</span>
                  <span className="text-[13px] font-semibold">{p.name}</span>
                </div>
                <Link
                  href={`/projects/${p.id}`}
                  className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary"
                >
                  Open project
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>
              <Card>
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {ts.map((t) => (
                      <li key={t.id} className="px-4 py-2.5 flex items-center gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] w-20 shrink-0" style={{ color: p.color ?? '#888' }}>{t.task_key}</span>
                        <span className="text-[13px] flex-1 truncate">{t.title}</span>
                        {t.is_blocked && <Badge variant="red" className="font-mono">blocked</Badge>}
                        <Badge variant={t.priority === 'critical' ? 'red' : t.priority === 'high' ? 'gold' : 'default'} className="font-mono">
                          {t.priority}
                        </Badge>
                        {t.story_points && (
                          <span className="font-mono text-[11px] text-muted-foreground w-8 text-right">{t.story_points}p</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
