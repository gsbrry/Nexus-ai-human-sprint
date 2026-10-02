'use client';
import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SectionHeader, StatusLine, LoadingPanel, type SaveState } from './shared';

type Org = { id: string; name: string; slug: string; logo_url: string | null; created_at: string };

export function OrgTab() {
  const [org, setOrg] = useState<Org | null>(null);
  const [role, setRole] = useState<string>('member');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<SaveState>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/orgs/current', { cache: 'no-store' });
      const json = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setState({ kind: 'error', message: json.error ?? 'Could not load the workspace' });
        return;
      }
      setOrg(json.org as Org);
      setRole(json.role as string);
      setName(json.org.name);
      setSlug(json.org.slug);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canEdit = role === 'org_admin' || role === 'super_admin';

  async function save() {
    setSaving(true);
    setState(null);
    try {
      const res = await fetch('/api/orgs/current', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not save');
      setState({ kind: 'ok', message: 'Workspace saved' });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not save' });
    } finally {
      setSaving(false);
    }
  }

  if (!org) return <LoadingPanel label="Loading workspace…" />;

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <SectionHeader
          code="N-03.01"
          title="Workspace"
          desc="The name and slug every member of this organisation sees."
        />

        {!canEdit && (
          <div className="rounded-md border border-border bg-[#0A0A0A] px-3 py-2 text-[12px] text-muted-foreground">
            You can view these settings. Only an org admin can change them.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="org_name">Organisation name</Label>
            <Input
              id="org_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org_slug">Slug</Label>
            <Input
              id="org_slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={!canEdit}
              className="font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="default" className="font-mono">
            Your role · {role}
          </Badge>
          <Badge variant="default" className="font-mono">
            Created {new Date(org.created_at).toLocaleDateString('en-GB')}
          </Badge>
        </div>

        {canEdit && (
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save workspace
            </Button>
            <StatusLine state={state} />
          </div>
        )}
        {!canEdit && <StatusLine state={state} />}
      </CardContent>
    </Card>
  );
}
