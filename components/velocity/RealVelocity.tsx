import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrg } from '@/lib/server/feature-flag';
import { EmptyOrgPrompt } from '@/components/setup/EmptyOrgPrompt';

export async function RealVelocity() {
  const active = await getActiveOrg();
  if (!active?.org_id) return <EmptyOrgPrompt />;

  const supabase = createClient();

  // Closed sprints + their per-task points
  const { data: sprintsData } = await supabase
    .from('sprints')
    .select('id, name, sprint_number, status, end_date, capacity_points, projects(key, color)')
    .eq('org_id', active.org_id)
    .in('status', ['active', 'closed'])
    .order('start_date', { ascending: false })
    .limit(20);
  const sprints = sprintsData ?? [];

  const { data: tasksData } = await supabase
    .from('tasks')
    .select('sprint_id, status, story_points')
    .eq('org_id', active.org_id)
    .is('deleted_at', null);
  const tasks = tasksData ?? [];

  const rollup: Record<string, { committed: number; completed: number; tasks: number }> = {};
  for (const t of tasks) {
    if (!t.sprint_id) continue;
    const sid = t.sprint_id;
    if (!rollup[sid]) rollup[sid] = { committed: 0, completed: 0, tasks: 0 };
    rollup[sid].committed += t.story_points ?? 0;
    rollup[sid].tasks++;
    if (t.status === 'done') rollup[sid].completed += t.story_points ?? 0;
  }

  const allCompleted = Object.values(rollup).map((r) => r.completed);
  const avg = allCompleted.length ? allCompleted.reduce((s, x) => s + x, 0) / allCompleted.length : 0;
  const maxCompleted = Math.max(1, ...allCompleted);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">V-01 · Velocity</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Velocity</h1>
          <p className="text-muted-foreground">Committed vs completed story points across recent sprints.</p>
        </div>
        <Badge variant="gold" className="font-mono">Real DB</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Sprints tracked" value={sprints.length.toString()} />
        <KpiCard label="Avg completed" value={`${avg.toFixed(1)} pts`} tone="gold" />
        <KpiCard label="Best sprint" value={`${maxCompleted} pts`} />
        <KpiCard label="Total tasks" value={tasks.length.toString()} />
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">V-02 · Per-sprint breakdown</div>
          {sprints.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
              No sprints with data yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {sprints.map((s) => {
                const r = rollup[s.id] ?? { committed: 0, completed: 0, tasks: 0 };
                const pct = r.committed > 0 ? (r.completed / r.committed) * 100 : 0;
                const proj = Array.isArray(s.projects) ? s.projects[0] : s.projects;
                return (
                  <li key={s.id} className="rounded-md border border-border bg-[#0A0A0A] p-4 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: proj?.color ?? '#666' }} />
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: proj?.color ?? '#888' }}>{proj?.key}</span>
                        <span className="text-[13px] font-semibold">{s.name}</span>
                        <Badge variant={s.status === 'active' ? 'gold' : 'default'} className="font-mono">{s.status}</Badge>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">{r.tasks} tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-card border border-border overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary-light" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-foreground w-28 text-right">
                        {r.completed}/{r.committed} pts ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: string; tone?: 'gold' }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
        <div className={'text-[24px] font-extrabold font-mono mt-1 ' + (tone === 'gold' ? 'text-primary' : 'text-foreground')}>{value}</div>
      </CardContent>
    </Card>
  );
}
