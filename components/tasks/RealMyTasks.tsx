import { CircleDashed } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrg } from '@/lib/server/feature-flag';
import { EmptyOrgPrompt } from '@/components/setup/EmptyOrgPrompt';
import Link from 'next/link';

export async function RealMyTasks() {
  const active = await getActiveOrg();
  if (!active?.org_id) return <EmptyOrgPrompt />;

  const supabase = createClient();
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, task_key, title, status, priority, story_points, is_blocked, due_date, projects(key, name, color), sprints(name, sprint_number)')
    .eq('org_id', active.org_id)
    .is('deleted_at', null)
    .eq('assignee_id', active.user.id)
    .order('priority', { ascending: false });

  const open = (tasks ?? []).filter((t) => t.status !== 'done');
  const done = (tasks ?? []).filter((t) => t.status === 'done');

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">T-06 · My tasks</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My tasks</h1>
          <p className="text-muted-foreground">Across every project you’re a member of.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="gold" className="font-mono">Real DB</Badge>
          <Badge variant="default" className="font-mono">{open.length} open</Badge>
          <Badge variant="default" className="font-mono">{done.length} done</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {!tasks || tasks.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              <CircleDashed className="size-6 mx-auto mb-3 text-muted-foreground" />
              Nothing assigned to you. 🥂
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {tasks.map((t) => {
                const proj = t.projects as unknown as { key: string; color: string | null } | null;
                return (
                  <li key={t.id} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] shrink-0 w-20" style={{ color: proj?.color ?? '#888' }}>
                      {t.task_key}
                    </span>
                    <span className="text-[13px] flex-1 truncate">{t.title}</span>
                    {t.is_blocked && (
                      <Badge variant="red" className="font-mono">Blocked</Badge>
                    )}
                    <Badge variant={t.status === 'done' ? 'gold' : t.status === 'in_progress' ? 'blue' : 'default'} className="font-mono">
                      {t.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="default" className="font-mono">{t.priority}</Badge>
                    {t.story_points && (
                      <span className="font-mono text-[11px] text-muted-foreground w-8 text-right">{t.story_points}p</span>
                    )}
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
