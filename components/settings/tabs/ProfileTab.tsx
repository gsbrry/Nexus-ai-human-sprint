'use client';
import { useEffect, useState } from 'react';
import { Loader2, Save, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { colorForId, initialsFor } from '@/lib/board';
import { SectionHeader, StatusLine, LoadingPanel, type SaveState } from './shared';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  timezone: string;
  telegram_chat_id: string | null;
};

export function ProfileTab({ onProfileLoaded }: { onProfileLoaded?: (p: Profile) => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [chatId, setChatId] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [state, setState] = useState<SaveState>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/users/me', { cache: 'no-store' });
      const json = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setState({ kind: 'error', message: json.error ?? 'Could not load your profile' });
        return;
      }
      const p = json.profile as Profile;
      setProfile(p);
      setFullName(p.full_name ?? '');
      setTimezone(p.timezone ?? 'UTC');
      setChatId(p.telegram_chat_id ?? '');
      onProfileLoaded?.(p);
    })();
    return () => {
      cancelled = true;
    };
    // onProfileLoaded is a stable parent callback; re-running on it would refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    setState(null);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          timezone: timezone.trim() || 'UTC',
          telegram_chat_id: chatId.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not save');
      setState({ kind: 'ok', message: 'Profile saved' });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not save' });
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    setState(null);
    try {
      const res = await fetch('/api/integrations/telegram/test', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not send');
      setState({ kind: 'ok', message: 'Test message sent to Telegram' });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not send' });
    } finally {
      setTesting(false);
    }
  }

  if (!profile) return <LoadingPanel label="Loading profile…" />;

  const avatarUser = {
    id: profile.id,
    name: fullName || profile.email,
    color: colorForId(profile.id),
    initials: initialsFor(fullName || profile.email),
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <SectionHeader
          code="N-02.01"
          title="Your profile"
          desc="Your name is what teammates see on task cards, comments and the velocity board."
        />

        <div className="flex items-center gap-4">
          <OwnerAvatar user={avatarUser} size={64} />
          <div className="min-w-0">
            <div className="font-bold truncate">{fullName || 'Unnamed'}</div>
            <div className="text-[12px] text-muted-foreground truncate">{profile.email}</div>
            <Badge variant="gold" className="font-mono mt-1">
              {profile.role}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Europe/London"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="chat_id">Telegram chat ID</Label>
            <Input
              id="chat_id"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="e.g. 123456789"
              className="font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Message your workspace bot, then open
              <span className="font-mono"> api.telegram.org/bot&lt;token&gt;/getUpdates </span>
              to find your chat ID. Leave blank to turn Telegram alerts off for you.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save profile
          </Button>
          <Button variant="outline" onClick={sendTest} disabled={testing || !chatId.trim()}>
            {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send test message
          </Button>
          <StatusLine state={state} />
        </div>
      </CardContent>
    </Card>
  );
}
