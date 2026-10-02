'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Copy,
  Key,
  Loader2,
  Pause,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { cn } from '@/lib/utils';
import { SectionHeader, StatusLine, LoadingPanel, type SaveState } from './shared';

type Agent = {
  id: string;
  name: string;
  description: string | null;
  provider: string | null;
  color: string;
  initials: string;
  status: 'active' | 'paused';
  open_tasks: number;
  done_tasks: number;
  open_points: number;
};

/**
 * AI agents as team members.
 *
 * An agent registered here is assignable on the board exactly like a person,
 * earns velocity, and — once given a key — can post its own progress back.
 */
export function AgentsTab() {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [role, setRole] = useState('member');
  const [state, setState] = useState<SaveState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [issuedKey, setIssuedKey] = useState<{ agentId: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [newName, setNewName] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/agents', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) {
      setState({ kind: 'error', message: json.error ?? 'Could not load agents' });
      setAgents([]);
      return;
    }
    setAgents(json.agents as Agent[]);
    setRole(json.role as string);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const canManage = role === 'scrum_master' || role === 'org_admin' || role === 'super_admin';

  async function create() {
    setCreating(true);
    setState(null);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          provider: newProvider.trim() || null,
          description: newDescription.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not add the agent');
      setNewName('');
      setNewProvider('');
      setNewDescription('');
      await load();
      setState({ kind: 'ok', message: `${json.agent.name} is now assignable on the board.` });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not add the agent' });
    } finally {
      setCreating(false);
    }
  }

  async function mutate(agent: Agent, payload: Record<string, unknown>) {
    setBusyId(agent.id);
    setState(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not update the agent');
      await load();
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not update' });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(agent: Agent) {
    setBusyId(agent.id);
    setState(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not remove the agent');
      await load();
      setState({ kind: 'ok', message: `${agent.name} removed. Its past work stays on record.` });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not remove' });
    } finally {
      setBusyId(null);
    }
  }

  async function issueKey(agent: Agent) {
    setBusyId(agent.id);
    setState(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/key`, { method: 'PUT' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not issue a key');
      setIssuedKey({ agentId: agent.id, key: json.api_key as string });
      setState({ kind: 'ok', message: 'Copy the key now. It is never shown again.' });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not issue a key' });
    } finally {
      setBusyId(null);
    }
  }

  async function copyKey() {
    if (!issuedKey) return;
    await navigator.clipboard.writeText(issuedKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!agents) return <LoadingPanel label="Loading agents…" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 space-y-5">
          <SectionHeader
            code="N-03.05"
            title={`AI agents · ${agents.length}`}
            desc="Agents are team members. Assign them tasks on the board, and they appear in sprint velocity alongside the humans."
          />

          {agents.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-10 text-center space-y-1">
              <Bot className="size-6 mx-auto text-muted-foreground" />
              <div className="text-sm text-muted-foreground">No agents yet.</div>
              <div className="text-[12px] text-muted-foreground">
                Add one below, then assign it a task like you would a teammate.
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              {agents.map((a, i) => (
                <div
                  key={a.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 flex-wrap',
                    i < agents.length - 1 && 'border-b border-border'
                  )}
                >
                  <OwnerAvatar
                    user={{
                      id: a.id,
                      name: a.name,
                      color: 'purple',
                      initials: a.initials,
                      kind: 'ai_agent',
                      status: a.status,
                    }}
                    size={32}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate">{a.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {a.provider ?? 'No provider set'}
                      {a.description ? ` · ${a.description}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge variant="default" className="font-mono">
                      {a.open_tasks} open · {a.open_points} pts
                    </Badge>
                    <Badge variant={a.status === 'active' ? 'teal' : 'default'} className="font-mono">
                      {a.status}
                    </Badge>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === a.id}
                        onClick={() =>
                          mutate(a, { status: a.status === 'active' ? 'paused' : 'active' })
                        }
                        title={a.status === 'active' ? 'Pause this agent' : 'Resume this agent'}
                      >
                        {busyId === a.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : a.status === 'active' ? (
                          <Pause className="size-3.5" />
                        ) : (
                          <Play className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === a.id}
                        onClick={() => issueKey(a)}
                        title="Issue or rotate this agent's webhook key"
                      >
                        <Key className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === a.id}
                        onClick={() => remove(a)}
                        title="Remove this agent"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}

                  {issuedKey?.agentId === a.id && (
                    <div className="w-full rounded-md border border-[#7F77DD]/40 bg-[#7F77DD]/10 px-3 py-2 space-y-1.5">
                      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#A8A2F0]">
                        Copy now — never shown again
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 font-mono text-[11px] break-all">{issuedKey.key}</code>
                        <Button variant="outline" size="sm" onClick={copyKey}>
                          {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
                        </Button>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground break-all">
                        POST /api/ai/agent-update · header x-nexus-agent-key
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <StatusLine state={state} />
        </CardContent>
      </Card>

      {canManage && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <SectionHeader
              code="N-03.06"
              title="Add an agent"
              desc="Name it after what it does. The name is what the team sees on task cards."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="agent_name">Name</Label>
                <Input
                  id="agent_name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="RAG Source Checker"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="agent_provider">Provider</Label>
                <Input
                  id="agent_provider"
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  placeholder="Claude Code"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="agent_description">What it does</Label>
              <Textarea
                id="agent_description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
                placeholder="Validates citations on every content task and flags non-peer-reviewed sources."
              />
            </div>
            <Button onClick={create} disabled={creating || newName.trim().length < 2}>
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add agent
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
