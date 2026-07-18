import {
  Database,
  Mail,
  UserPlus,
  Users,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrg } from '@/lib/server/feature-flag';
import { EmptyOrgPrompt } from '@/components/setup/EmptyOrgPrompt';
import { RealMembersTab } from '@/components/settings/RealMembersTab';

const ROLE_LABEL: Record<string, string> = {
  member: 'Member',
  scrum_master: 'Scrum master',
  org_admin: 'Org admin',
  super_admin: 'Super admin',
};

export async function RealSettings() {
  const active = await getActiveOrg();
  if (!active?.org_id) return <EmptyOrgPrompt />;
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url')
    .eq('id', active.user.id)
    .maybeSingle();

  const org = active.organisations as unknown as { id: string; name: string; slug: string } | null;
  const userEmail = profile?.email ?? active.user.email ?? '';
  const userName = profile?.full_name ?? userEmail.split('@')[0];
  const userRole = profile?.role ?? active.role ?? 'member';

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            N-02 / N-03 · Settings
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Your profile, your workspace, and the keys that let NEXUS talk to the rest of the stack.
          </p>
        </div>
        <Badge variant="gold" className="font-mono">
          <Database className="size-3" />
          Real DB
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="org">Organisation</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <SectionHeader code="N-02.01" title="Identity" desc="Read-only view sourced from Supabase profiles table." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full name" value={userName} />
                <Field label="Email" value={userEmail} mono />
                <Field label="User ID" value={active.user.id} mono />
                <Field label="Platform role" value={ROLE_LABEL[userRole] ?? userRole} />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                Profile edit form coming in next migration pass.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="org" className="mt-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <SectionHeader code="N-03.01" title="Workspace" desc="Everyone on your team sees these settings." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Organisation name" value={org?.name ?? '—'} />
                <Field label="URL slug" value={org?.slug ?? '—'} mono />
                <Field label="Org ID" value={org?.id ?? '—'} mono />
                <Field label="Your role in this org" value={ROLE_LABEL[active.role] ?? active.role} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <RealMembersTab orgId={active.org_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SectionHeader({ code, title, desc }: { code: string; title: string; desc: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{code}</div>
      <div className="text-base font-bold tracking-tight">{title}</div>
      <p className="text-[12px] text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} readOnly className={'bg-[#0A0A0A] ' + (mono ? 'font-mono text-[11px]' : '')} />
    </div>
  );
}
