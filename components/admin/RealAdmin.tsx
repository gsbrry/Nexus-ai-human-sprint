import { format } from 'date-fns';
import Link from 'next/link';
import { Building2, Hash, Layers, Shield, Sparkles, Users, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  deleted_at: string | null;
};

/**
 * SA-01 / SA-02 on real data.
 *
 * Everything here is read through the caller's own session, so the numbers are
 * exactly what RLS lets a super admin see — there is no service-role bypass on
 * this screen. A non-super-admin gets the refusal panel instead.
 */
export async function RealAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user?.id ?? '')
    .maybeSingle();

  if (me?.role !== 'super_admin') {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <div className="mx-auto size-12 rounded-full border border-border bg-card flex items-center justify-center">
              <Shield className="size-5 text-muted-foreground" />
            </div>
            <h1 className="text-lg font-bold">Super admin only</h1>
            <p className="text-sm text-muted-foreground">
              This screen shows every workspace on the platform. Your account is a{' '}
              <span className="font-mono">{me?.role ?? 'member'}</span>, so it is not available to you.
            </p>
            <Link
              href="/dashboard"
              className="inline-block font-mono text-[10px] uppercase tracking-[0.12em] text-primary"
            >
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [orgsRes, membersRes, projectsRes, tasksRes, aiRes, auditRes] = await Promise.all([
    supabase.from('organisations').select('id, name, slug, created_at, deleted_at'),
    supabase.from('org_members').select('org_id, user_id').is('deleted_at', null),
    supabase.from('projects').select('id, org_id').is('deleted_at', null),
    supabase.from('tasks').select('id, org_id, status, story_points').is('deleted_at', null),
    supabase.from('ai_interactions').select('org_id, input_tokens, output_tokens, interaction_type'),
    supabase
      .from('audit_log')
      .select('id, org_id, actor_id, action, table_name, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const orgs = (orgsRes.data ?? []) as OrgRow[];
  const members = (membersRes.data ?? []) as { org_id: string; user_id: string }[];
  const projects = (projectsRes.data ?? []) as { id: string; org_id: string }[];
  const tasks = (tasksRes.data ?? []) as {
    id: string;
    org_id: string;
    status: string;
    story_points: number | null;
  }[];
  const ai = (aiRes.data ?? []) as {
    org_id: string;
    input_tokens: number | null;
    output_tokens: number | null;
  }[];
  const audit = (auditRes.data ?? []) as {
    id: string;
    org_id: string | null;
    actor_id: string | null;
    action: string;
    table_name: string;
    created_at: string;
  }[];

  const liveOrgs = orgs.filter((o) => !o.deleted_at);
  const uniqueUsers = new Set(members.map((m) => m.user_id)).size;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTokens = ai.reduce((s, r) => s + (r.input_tokens ?? 0) + (r.output_tokens ?? 0), 0);

  const countBy = <T extends { org_id: string }>(rows: T[]) =>
    rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.org_id] = (acc[r.org_id] ?? 0) + 1;
      return acc;
    }, {});

  const memberCount = countBy(members);
  const projectCount = countBy(projects);
  const taskCount = countBy(tasks);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              SA-01 / SA-02 · Platform admin
            </div>
            <Badge variant="gold" className="font-mono">Real DB</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Super admin</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-[640px]">
            Every workspace running on this deployment, with the audit trail underneath.
          </p>
        </div>
        <Badge variant="gold" className="font-mono">
          <Shield className="size-3" />
          Super admin only
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi icon={Building2} label="Workspaces" value={liveOrgs.length.toString()} />
        <Kpi icon={Users} label="People" value={uniqueUsers.toString()} />
        <Kpi icon={Layers} label="Projects" value={projects.length.toString()} />
        <Kpi icon={Hash} label="Tasks" value={tasks.length.toString()} />
        <Kpi
          icon={Zap}
          label="Tasks done"
          value={`${doneTasks} (${Math.round((doneTasks / Math.max(1, tasks.length)) * 100)}%)`}
          tone="gold"
        />
        <Kpi icon={Sparkles} label="AI tokens" value={totalTokens.toLocaleString()} />
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">SA-02 · Organisations</div>
            <div className="text-base font-bold">Every workspace</div>
          </div>

          <div className="rounded-md border border-border overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[1fr_120px_90px_90px_90px_110px] gap-3 px-4 py-2.5 bg-[#0A0A0A] border-b border-border font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <div>Workspace</div>
                <div>Slug</div>
                <div className="text-right">People</div>
                <div className="text-right">Projects</div>
                <div className="text-right">Tasks</div>
                <div className="text-right">Created</div>
              </div>
              {orgs.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No workspaces yet.
                </div>
              ) : (
                orgs.map((o, i) => (
                  <div
                    key={o.id}
                    className={cn(
                      'grid grid-cols-[1fr_120px_90px_90px_90px_110px] gap-3 px-4 py-3 items-center',
                      i < orgs.length - 1 && 'border-b border-border'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[13px] font-medium truncate">{o.name}</span>
                      {o.deleted_at && <Badge variant="red" className="font-mono">archived</Badge>}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground truncate">{o.slug}</div>
                    <div className="text-right font-mono text-[12px]">{memberCount[o.id] ?? 0}</div>
                    <div className="text-right font-mono text-[12px]">{projectCount[o.id] ?? 0}</div>
                    <div className="text-right font-mono text-[12px]">{taskCount[o.id] ?? 0}</div>
                    <div className="text-right font-mono text-[11px] text-muted-foreground">
                      {format(new Date(o.created_at), 'dd MMM yy')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Audit log</div>
            <div className="text-base font-bold">Last 50 entries</div>
            <p className="text-[12px] text-muted-foreground mt-1">
              Append only. Update and delete are revoked from every role, including service_role.
            </p>
          </div>

          {audit.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Nothing logged yet.
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              {audit.map((e, i) => (
                <div
                  key={e.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5',
                    i < audit.length - 1 && 'border-b border-border'
                  )}
                >
                  <Badge variant={e.action === 'soft_delete' ? 'red' : 'default'} className="font-mono">
                    {e.action}
                  </Badge>
                  <span className="font-mono text-[11px] text-muted-foreground">{e.table_name}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {format(new Date(e.created_at), 'dd MMM HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone?: 'gold';
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
          <Icon className="size-3 text-primary" />
          {label}
        </div>
        <div
          className={cn(
            'text-[20px] font-extrabold font-mono mt-1',
            tone === 'gold' ? 'text-primary' : 'text-foreground'
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
