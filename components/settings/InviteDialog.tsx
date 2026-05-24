'use client';
import { useState } from 'react';
import { CheckCircle2, Loader2, Mail, Plus, Send, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ROLES = [
  { value: 'member', label: 'Member', desc: 'Read + edit assigned tasks.' },
  { value: 'scrum_master', label: 'Scrum master', desc: 'Plan sprints, run ceremonies.' },
  { value: 'org_admin', label: 'Org admin', desc: 'Full workspace control.' },
] as const;

type Pending = { email: string; role: (typeof ROLES)[number]['value'] };

export function InviteDialog({
  open,
  onOpenChange,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onInvite?: (emails: string[], role: Pending['role']) => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Pending['role']>('member');
  const [pending, setPending] = useState<Pending[]>([]);
  const [telegram, setTelegram] = useState(true);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function pushEmail() {
    const e = email.trim().toLowerCase();
    if (!e) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError('That doesn’t look like a valid email.');
      return;
    }
    if (pending.some((p) => p.email === e)) {
      setError('Already in the invite list.');
      return;
    }
    setError(null);
    setPending((prev) => [...prev, { email: e, role }]);
    setEmail('');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      pushEmail();
    }
  }

  function removeAt(i: number) {
    setPending((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function sendAll() {
    if (pending.length === 0) {
      if (email.trim()) pushEmail();
      else {
        setError('Add at least one email.');
        return;
      }
    }
    setSending(true);
    setError(null);
    // Mock send — pretend Resend + Telegram fired
    await new Promise((r) => setTimeout(r, 800));
    setDone(pending.map((p) => p.email));
    onInvite?.(pending.map((p) => p.email), role);
    setSending(false);
  }

  function reset() {
    setEmail('');
    setPending([]);
    setRole('member');
    setDone(null);
    setError(null);
    setTelegram(true);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
            N-04 · Invite teammates
          </div>
          <DialogTitle>Invite to your workspace</DialogTitle>
          <DialogDescription>
            We&apos;ll send magic-link invites via email. Telegram pings fire too if the org has a bot configured.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-4 py-2">
            <div className="rounded-md border border-gold/30 bg-gold/[0.05] p-4 flex items-start gap-3">
              <CheckCircle2 className="size-5 text-gold mt-0.5 shrink-0" />
              <div className="space-y-1">
                <div className="text-sm font-semibold">
                  {done.length} invite{done.length === 1 ? '' : 's'} sent
                </div>
                <div className="text-[12px] text-muted-foreground">
                  Magic links expire in 7 days. Recipients land on the profile-setup screen after clicking through.
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {done.map((e) => (
                    <Badge key={e} variant="default" className="font-mono text-[10px]">
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={reset}>
                <Plus className="size-4" />
                Invite more
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Default role for these invites</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      'rounded-md border px-3 py-2.5 text-left transition-colors',
                      role === r.value
                        ? 'border-gold/50 bg-gold/[0.06]'
                        : 'border-border bg-[#0A0A0A] hover:border-gold/30'
                    )}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-gold">
                      {r.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {r.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-email">Email addresses</Label>
              <div className="rounded-md border border-border bg-[#0A0A0A] px-2 py-2 flex flex-wrap items-center gap-1.5 min-h-[42px]">
                {pending.map((p, i) => (
                  <span
                    key={p.email}
                    className="inline-flex items-center gap-1 rounded-md bg-gold/10 border border-gold/30 px-2 py-0.5 font-mono text-[11px] text-gold"
                  >
                    <Mail className="size-3" />
                    {p.email}
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      className="text-gold/60 hover:text-gold"
                      aria-label="Remove"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <Input
                  id="invite-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={onKeyDown}
                  onBlur={() => email && pushEmail()}
                  placeholder={pending.length ? 'Add another…' : 'name@team.com'}
                  className="border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1 flex-1 min-w-[120px] h-7"
                />
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                Press Enter, comma, or space to add. Up to 25 per send.
              </p>
            </div>

            <label className="flex items-center justify-between rounded-md border border-border bg-[#0A0A0A] px-3 py-2.5 cursor-pointer">
              <div>
                <div className="text-[12px] font-medium">Also notify via Telegram</div>
                <div className="text-[11px] text-muted-foreground">
                  Sends a heads-up to the org channel if a bot is linked.
                </div>
              </div>
              <input
                type="checkbox"
                checked={telegram}
                onChange={(e) => setTelegram(e.target.checked)}
                className="size-4 accent-gold"
              />
            </label>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={sendAll} disabled={sending}>
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Send {pending.length || ''} invite{pending.length === 1 ? '' : 's'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
