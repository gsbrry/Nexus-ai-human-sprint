'use client';
import { useCallback, useEffect, useState } from 'react';
import { Bot, CheckCircle2, Key, Loader2, Save, Sparkles, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SectionHeader, StatusLine, type SaveState } from './shared';

/**
 * Bring-your-own keys (N-02.04).
 *
 * Nexus ships with no Anthropic key and no Telegram bot: the manual JSON import
 * flow (Mode 1) and in-app notifications work without either. A user who wants
 * Mode 2 (one-click Claude import) adds their own Anthropic key here; an org
 * admin who wants Telegram alerts connects a @BotFather bot here.
 *
 * Neither secret is ever sent back to the browser. The server reports only
 * whether one is configured.
 */
export function ApiKeysTab() {
  return (
    <div className="space-y-4">
      <AnthropicCard />
      <TelegramCard />
    </div>
  );
}

function AnthropicCard() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<SaveState>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/users/api-key', { cache: 'no-store' });
    const json = await res.json();
    setHasKey(res.ok ? Boolean(json.has_anthropic_key) : false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setBusy(true);
    setState(null);
    try {
      const res = await fetch('/api/users/api-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anthropic_api_key: value.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not save the key');
      setValue('');
      setHasKey(true);
      setState({ kind: 'ok', message: 'Key saved. API import mode is on for you.' });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not save the key' });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setState(null);
    try {
      const res = await fetch('/api/users/api-key', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not remove the key');
      setHasKey(false);
      setState({ kind: 'ok', message: 'Key removed. You are back on manual JSON import.' });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not remove the key' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <SectionHeader
            code="N-02.04"
            title="Anthropic API key"
            desc="Optional. Without a key Nexus uses the manual JSON flow: it writes the Claude prompt for you, you paste the result back. With a key, imports call Claude directly."
          />
          {hasKey === null ? null : hasKey ? (
            <Badge variant="teal" className="font-mono">
              <CheckCircle2 className="size-2.5 mr-1" /> connected
            </Badge>
          ) : (
            <Badge variant="default" className="font-mono">
              not set
            </Badge>
          )}
        </div>

        <div className="rounded-md border border-border bg-[#0A0A0A] px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <Sparkles className="size-3 text-primary" />
            What changes when you add one
          </div>
          <ModeLine
            on={!hasKey}
            title="Mode 1 · Manual JSON"
            desc="Always available. Copy the prompt, paste Claude's JSON back, validate, import."
          />
          <ModeLine
            on={Boolean(hasKey)}
            title="Mode 2 · API connected"
            desc="Import calls Claude for you and drops the JSON straight into the editor."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="anthropic_key">
            <Key className="size-3.5 inline mr-1" />
            {hasKey ? 'Replace key' : 'Add key'}
          </Label>
          <Input
            id="anthropic_key"
            type="password"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="sk-ant-..."
            className="font-mono"
          />
          <p className="text-[11px] text-muted-foreground">
            Stored against your profile only, and never returned to the browser or written to logs.
            Get one at console.anthropic.com. Usage is billed to your own Anthropic account.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={save} disabled={busy || value.trim().length < 20}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save key
          </Button>
          {hasKey && (
            <Button variant="outline" onClick={remove} disabled={busy}>
              <Trash2 className="size-4" />
              Remove
            </Button>
          )}
          <StatusLine state={state} />
        </div>
      </CardContent>
    </Card>
  );
}

function TelegramCard() {
  const [hasBot, setHasBot] = useState<boolean | null>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<SaveState>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/integrations/telegram', { cache: 'no-store' });
    const json = await res.json();
    setHasBot(res.ok ? Boolean(json.has_telegram_bot_token) : false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setBusy(true);
    setState(null);
    try {
      const res = await fetch('/api/integrations/telegram', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: value.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not save the bot token');
      setValue('');
      setHasBot(true);
      setState({ kind: 'ok', message: `Connected to @${json.bot?.username ?? 'your bot'}` });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not save the token' });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setState(null);
    try {
      const res = await fetch('/api/integrations/telegram', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not disconnect');
      setHasBot(false);
      setState({ kind: 'ok', message: 'Telegram disconnected for this workspace.' });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not disconnect' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <SectionHeader
            code="N-03.03"
            title="Telegram bot"
            desc="Optional, and set once per workspace by an org admin. Each member then adds their own chat ID on the Profile tab."
          />
          {hasBot === null ? null : hasBot ? (
            <Badge variant="teal" className="font-mono">
              <CheckCircle2 className="size-2.5 mr-1" /> connected
            </Badge>
          ) : (
            <Badge variant="default" className="font-mono">
              not set
            </Badge>
          )}
        </div>

        <div className="rounded-md border border-border bg-[#0A0A0A] px-4 py-3 space-y-1.5">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <Bot className="size-3 text-primary" />
            How to get a token
          </div>
          <ol className="text-[12px] text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Message @BotFather on Telegram and send /newbot.</li>
            <li>Pick a name and a username, and copy the token it returns.</li>
            <li>Paste it below. Nexus verifies the bot before saving.</li>
          </ol>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telegram_token">{hasBot ? 'Replace bot token' : 'Bot token'}</Label>
          <Input
            id="telegram_token"
            type="password"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="123456789:AA..."
            className="font-mono"
          />
          <p className="text-[11px] text-muted-foreground">
            Held in a table no client role can read, and never returned to the browser. Saving also
            rotates the webhook secret that guards inbound agent updates.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={save} disabled={busy || value.trim().length < 20}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Connect bot
          </Button>
          {hasBot && (
            <Button variant="outline" onClick={remove} disabled={busy}>
              <Trash2 className="size-4" />
              Disconnect
            </Button>
          )}
          <StatusLine state={state} />
        </div>
      </CardContent>
    </Card>
  );
}

function ModeLine({ on, title, desc }: { on: boolean; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className={`mt-1 size-2 rounded-full shrink-0 ${on ? 'bg-[#1D9E75]' : 'bg-[#555]'}`}
        aria-hidden
      />
      <div>
        <div className={`text-[12px] font-medium ${on ? 'text-foreground' : 'text-muted-foreground'}`}>
          {title}
          {on && <span className="font-mono text-[10px] text-[#5BC498]"> · active</span>}
        </div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
