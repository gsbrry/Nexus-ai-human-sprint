import { ImportWizard, type ImportProject, type ImportSprint } from '@/components/import/ImportWizard';
import { createClient } from '@/lib/supabase/server';
import { useRealData, getActiveOrg } from '@/lib/server/feature-flag';
import { fetchOrgUsers } from '@/lib/server/org-users';
import { EmptyOrgPrompt } from '@/components/setup/EmptyOrgPrompt';
import { Badge } from '@/components/ui/badge';

export default async function ImportPage() {
  const live = await useRealData();

  let projects: ImportProject[] | undefined;
  let sprints: ImportSprint[] | undefined;
  let members: { name: string; role?: string }[] | undefined;
  let hasAnthropicKey = false;

  if (live) {
    const active = await getActiveOrg();
    if (!active?.org_id) return <EmptyOrgPrompt />;

    const supabase = createClient();
    const [{ data: projectRows }, { data: sprintRows }, team, { data: hasKey }] = await Promise.all([
      supabase
        .from('projects')
        .select('id, key, name, color')
        .eq('org_id', active.org_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true }),
      supabase
        .from('sprints')
        .select('id, project_id, name, status, start_date, end_date, goal, sprint_number')
        .eq('org_id', active.org_id)
        .is('deleted_at', null)
        .order('sprint_number', { ascending: true }),
      fetchOrgUsers(supabase, active.org_id),
      supabase.rpc('has_anthropic_key'),
    ]);

    projects = (projectRows ?? []) as ImportProject[];
    sprints = (sprintRows ?? []) as ImportSprint[];
    members = team.map((u) => ({ name: u.name, role: u.role }));
    hasAnthropicKey = Boolean(hasKey);

    if (projects.length === 0) return <EmptyOrgPrompt />;
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">I-01 · Import</div>
          {live && <Badge variant="gold" className="font-mono">Real DB</Badge>}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Import tasks</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Upload a CSV → copy the Claude prompt → paste the JSON Claude returns → review → import.
          No API key required.
        </p>
      </div>
      <ImportWizard
        projects={projects}
        sprints={sprints}
        members={members}
        live={live}
        hasAnthropicKey={hasAnthropicKey}
      />
    </div>
  );
}
