import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowUpRight, Repeat, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrg } from '@/lib/server/feature-flag';
import { EmptyOrgPrompt } from '@/components/setup/EmptyOrgPrompt';

export async function RealSprintsList() {
  const active = await getActiveOrg();
  if (!active?.org_id) return <EmptyOrgPrompt />;

  const supabase = createClient();

  const { data: sprints } = await supabase
    .from('sprints')
    .select('id, name, status, sprint_number, start_date, end_date, goal, capacity_points, projects(id, key, name, color)')
    .eq('org_id', active.org_id)
    .order('status', { ascending: true })
    .order('start_date', { ascending: false });

  // Task rollup per sprint
  const { data: taskRows } = await supabase
    .from('tasks')
    .select('sprint_id, status, is_blocked, story_points')
    .eq('org_id', active.org_id)
    .is('deleted_at', null);

  const rollup: Record<string, { total: number; done: number; blocked: number; pts: number; donePts: number }> = {};
  for (const t of taskRows ?? []) {
    if (!t.sprint_id) continue;
    const sid = t.sprint_id as string;
    if (!rollup[sid]) rollup[sid] = { total: 0, done: 0, blocked: 0, pts: 0, donePts: 0 };
    rollup[sid].total++;
    rollup[sid].pts += t.story_points ?? 0;
    if (t.status === 'done') {
      rollup[sid].done++;
      rollup[sid].donePts += t.story_points ?? 0;
    }
    if (t.is_blocked && t.status !== 'done') rollup[sid].blocked++;
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">T-01 · Sprints</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Sprints</h1>
          <p className="text-muted-foreground">Every active and planned sprint across your projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="gold" className="font-mono">Real DB</Badge>
          <Link
            href="/sprints/backlog"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
          >
            <ArrowUpRight className="size-3.5" />
            T-05 · Global backlog
          </Link>
        </div>
      </div>

      {!sprints || sprints.length === 0 ? (
        <EmptyState text="No sprints yet." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sprints.map((s) => {
            const r = rollup[s.id] ?? { total: 0, done: 0, blocked: 0, pts: 0, donePts: 0 };
            const pct = r.pts > 0 ? (r.donePts / r.pts) * 100 : 0;
            const proj = s.projects as unknown as { id: string; key: string; name: string; color: string | null } | null;
            return (
              <Link key={s.id} href={`/sprints/${s.id}`}>
                <Card className="hover:border-primary/30 transition-colors h-full">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full shrink-0" style={{ background: proj?.color ?? '#666' }} />
                          <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: proj?.color ?? '#888' }}>
                            {proj?.key}
                          </span>
                          <Badge variant={s.status === 'active' ? 'gold' : 'default'} className="font-mono">
                            {s.status}
                          </Badge>
                        </div>
                        <h3 className="text-base font-bold leading-snug">{s.name}</h3>
                        {s.goal && <p className="text-[12px] text-muted-foreground line-clamp-2">{s.goal}</p>}
                      </div>
                      <ArrowUpRight className="size-4 text-muted-foreground shrink-0" />
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <Mini icon={Target} label="Tasks" value={r.total.toString()} />
                      <Mini icon={Repeat} label="Done" value={r.done.toString()} tone="gold" />
                      <Mini label="Points" value={`${r.donePts}/${r.pts}`} />
                      <Mini label="Blocked" value={r.blocked.toString()} tone={r.blocked ? 'red' : undefined} />
                    </div>

                    <div className="space-y-1.5">
                      <div className="h-1.5 rounded-full bg-[#0A0A0A] border border-border overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary-light" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        <span>{format(new Date(s.start_date), 'dd MMM')} → {format(new Date(s.end_date), 'dd MMM')}</span>
                        <span className="text-primary">{pct.toFixed(0)}% pts</span>
                      </div>
                    </div>
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

function Mini({ icon: Icon, label, value, tone }: { icon?: typeof Target; label: string; value: string; tone?: 'red' | 'gold' }) {
  return (
    <div className="rounded-md border border-border bg-[#0A0A0A] px-2.5 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="size-2.5" />}
        {label}
      </div>
      <div className={'font-mono text-[16px] font-extrabold mt-0.5 ' + (tone === 'red' ? 'text-destructive' : tone === 'gold' ? 'text-primary' : 'text-foreground')}>
        {value}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
