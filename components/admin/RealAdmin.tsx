import { Activity, Building2, DollarSign, FolderKanban, ListTodo, Repeat, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createServiceClient } from '@/lib/supabase/server';
import { getActiveOrg } from '@/lib/server/feature-flag';
import { EmptyOrgPrompt } from '@/components/setup/EmptyOrgPrompt';
import { cn } from '@/lib/utils';

export async function RealAdmin() {
  const active = await getActiveOrg();
  if (!active?.org_id) return <EmptyOrgPrompt />;

  // Super-admin only
  if (active.role !== 'super_admin') {
    return (
      <div className="max-w-[640px] mx-auto px-4 py-16 space-y-3 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-destructive">
          403 · Super admin only
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">No access</h1>
        <p className="text-muted-foreground text-sm">
          This area requires <code className="font-mono">super_admin</code> role on your profile.
        </p>
      </div>
    );
  }

  // Service-role queries cross all orgs
  const admin = createServiceClient();
  const [
    { data: orgs, count: orgCount },
    { count: memberCount },
    { count: projectCount },
    { count: taskCount },
    { count: sprintCount },
  ] = await Promise.all([
    admin.from('organisations').select('id, name, slug, created_at, created_by', { count: 'exact' }).order('created_at', { ascending: false }),
    admin.from('org_members').select('*', { count: 'exact', head: true }),
    admin.from('projects').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    admin.from('tasks').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    admin.from('sprints').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  // Per-org rollup (members + projects)
  const orgList = (orgs ?? []) as { id: string; name: string; slug: string; created_at: string; created_by: string | null }[];
  const orgIds = orgList.map((o) => o.id);
  const [{ data: memberRows }, { data: projectRows }] = await Promise.all([
    admin.from('org_members').select('org_id').in('org_id', orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000']),
    admin.from('projects').select('org_id').in('org_id', orgIds.length > 0 ? orgIds : ['00000000-0000-0000-0000-000000000000']).is('deleted_at', null),
  ]);
  const memberByOrg: Record<string, number> = {};
  for (const r of memberRows ?? []) memberByOrg[r.org_id as string] = (memberByOrg[r.org_id as string] ?? 0) + 1;
  const projectByOrg: Record<string, number> = {};
  for (const r of projectRows ?? []) projectByOrg[r.org_id as string] = (projectByOrg[r.org_id as string] ?? 0) + 1;

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            SA-01 / SA-02 · Platform admin
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Super admin</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-[640px]">
            Every workspace on this NEXUS instance. Counts come from live Supabase tables via service role.
          </p>
        </div>
        <Badge variant="gold" className="font-mono">Real DB</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total orgs" value={(orgCount ?? 0).toString()} icon={Building2} />
        <Kpi label="Members" value={(memberCount ?? 0).toString()} icon={Users} />
        <Kpi label="Projects" value={(projectCount ?? 0).toString()} icon={FolderKanban} />
        <Kpi label="Active sprints" value={(sprintCount ?? 0).toString()} icon={Repeat} tone="gold" />
      </div>

      <Tabs defaultValue="orgs" className="w-full">
        <TabsList className="grid grid-cols-2 w-full md:w-auto">
          <TabsTrigger value="orgs">Organisations</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="orgs" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {orgList.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">No organisations yet.</div>
              ) : (
                <>
                  <div className="hidden md:grid grid-cols-[1.5fr_120px_100px_100px_140px] gap-3 px-5 py-2.5 bg-[#0A0A0A] border-b border-border font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    <div>Workspace</div>
                    <div>Slug</div>
                    <div className="text-right">Members</div>
                    <div className="text-right">Projects</div>
                    <div className="text-right">Created</div>
                  </div>
                  {orgList.map((o) => (
                    <div
                      key={o.id}
                      className="grid grid-cols-1 md:grid-cols-[1.5fr_120px_100px_100px_140px] gap-3 px-5 py-3.5 border-b border-border last:border-b-0 items-center hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold truncate">{o.name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                          {o.id.slice(0, 8)}…
                        </div>
                      </div>
                      <div>
                        <Badge variant="default" className="font-mono">{o.slug}</Badge>
                      </div>
                      <div className="font-mono text-[12px] font-bold md:text-right">
                        {memberByOrg[o.id] ?? 0}
                      </div>
                      <div className="font-mono text-[12px] font-bold md:text-right">
                        {projectByOrg[o.id] ?? 0}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground md:text-right">
                        {new Date(o.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">SA-02.01 · Platform snapshot</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Mini label="Orgs" value={(orgCount ?? 0).toString()} />
                <Mini label="Members" value={(memberCount ?? 0).toString()} />
                <Mini label="Projects" value={(projectCount ?? 0).toString()} />
                <Mini label="Active sprints" value={(sprintCount ?? 0).toString()} />
                <Mini label="Total tasks" value={(taskCount ?? 0).toString()} />
              </div>
              <p className="text-[12px] text-muted-foreground">
                Detailed time-series + MRR analytics ship when billing is wired. Right now this view is mostly a sanity dashboard for raw counts.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Building2; tone?: 'gold' }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
          <Icon className="size-3 text-primary" />
          {label}
        </div>
        <div className={cn('text-[26px] font-extrabold font-mono mt-1 tracking-tight', tone === 'gold' ? 'text-primary' : 'text-foreground')}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-[#0A0A0A] px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="font-mono text-[18px] font-extrabold mt-0.5">{value}</div>
    </div>
  );
}
