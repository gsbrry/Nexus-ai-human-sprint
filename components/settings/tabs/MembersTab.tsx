'use client';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { InviteDialog } from '@/components/settings/InviteDialog';
import type { BoardColor } from '@/lib/board';
import { SectionHeader, StatusLine, LoadingPanel, type SaveState } from './shared';

type Member = {
  id: string;
  name: string;
  email?: string;
  role: 'member' | 'scrum_master' | 'org_admin' | 'super_admin';
  joined_at: string;
  color: BoardColor;
  initials: string;
  is_you: boolean;
};

const ASSIGNABLE: Member['role'][] = ['member', 'scrum_master', 'org_admin'];

export function MembersTab() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [role, setRole] = useState<string>('member');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [state, setState] = useState<SaveState>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/orgs/members', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) {
      setState({ kind: 'error', message: json.error ?? 'Could not load members' });
      setMembers([]);
      return;
    }
    setMembers(json.members as Member[]);
    setRole(json.role as string);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const canManage = role === 'org_admin' || role === 'super_admin';

  async function mutate(userId: string, payload: Record<string, unknown>) {
    setBusyId(userId);
    setState(null);
    try {
      const res = await fetch('/api/orgs/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not update member');
      await load();
      setState({ kind: 'ok', message: 'Member updated' });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not update member' });
    } finally {
      setBusyId(null);
    }
  }

  if (!members) return <LoadingPanel label="Loading members…" />;

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <SectionHeader
            code="N-03.02"
            title={`Members · ${members.length}`}
            desc="Everyone with access to this workspace, and what they can do in it."
          />
          {canManage && (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" />
              Invite member
            </Button>
          )}
        </div>

        <div className="rounded-md border border-border overflow-hidden">
          {members.map((m, i) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < members.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <OwnerAvatar user={m} size={32} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium truncate">
                  {m.name}
                  {m.is_you && <span className="text-muted-foreground"> · you</span>}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">{m.email}</div>
              </div>

              {canManage && !m.is_you && m.role !== 'super_admin' ? (
                <select
                  value={m.role}
                  disabled={busyId === m.id}
                  onChange={(e) => mutate(m.id, { role: e.target.value })}
                  className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] outline-none focus:border-primary/50"
                >
                  {ASSIGNABLE.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <Badge variant="default" className="font-mono">
                  {m.role}
                </Badge>
              )}

              {canManage && !m.is_you && m.role !== 'super_admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === m.id}
                  onClick={() => mutate(m.id, { remove: true })}
                  aria-label={`Remove ${m.name}`}
                >
                  {busyId === m.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <UserMinus className="size-3.5" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>

        <StatusLine state={state} />

        <InviteDialog
          open={inviteOpen}
          onOpenChange={(v) => {
            setInviteOpen(v);
            if (!v) void load();
          }}
        />
      </CardContent>
    </Card>
  );
}
