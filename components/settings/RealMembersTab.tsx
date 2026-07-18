'use client';
import { useEffect, useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InviteDialog } from '@/components/settings/InviteDialog';

const ROLE_LABEL: Record<string, string> = {
  member: 'Member',
  scrum_master: 'Scrum master',
  org_admin: 'Org admin',
  super_admin: 'Super admin',
};

const ROLE_VARIANT: Record<string, 'default' | 'blue' | 'gold' | 'teal'> = {
  member: 'default',
  scrum_master: 'blue',
  org_admin: 'gold',
  super_admin: 'teal',
};

type Member = {
  user_id: string;
  role: string;
  full_name: string | null;
  email: string | null;
  initials: string;
};

export function RealMembersTab({ orgId }: { orgId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/orgs/${orgId}/members`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setMembers(d.members ?? []);
      })
      .catch(() => setMembers([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                N-03.03
              </div>
              <div className="text-base font-bold">
                Members · {loading ? '—' : members.length}
              </div>
              <p className="text-[12px] text-muted-foreground mt-1">
                Live from <code className="font-mono">org_members</code> + <code className="font-mono">profiles</code> tables.
              </p>
            </div>
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" />
              Invite teammates
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-10 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Loading…
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
              No members yet.
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <div className="grid grid-cols-[1fr_220px_140px_60px] gap-3 px-4 py-2.5 bg-[#0A0A0A] border-b border-border font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <div>Member</div>
                <div>Email</div>
                <div>Role</div>
                <div className="text-right">Actions</div>
              </div>
              {members.map((m) => (
                <div
                  key={m.user_id}
                  className="grid grid-cols-[1fr_220px_140px_60px] gap-3 px-4 py-3 border-b border-border last:border-b-0 items-center"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-mono text-[11px] font-bold text-primary">
                      {m.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">
                        {m.full_name ?? m.email?.split('@')[0] ?? '—'}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground truncate">
                        {m.user_id.slice(0, 8)}…
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground truncate">{m.email}</div>
                  <div>
                    <Badge variant={ROLE_VARIANT[m.role] ?? 'default'} className="font-mono">
                      {ROLE_LABEL[m.role] ?? m.role}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <button
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove"
                      title="Remove member (TBD)"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
