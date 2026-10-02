'use client';
import { useEffect, useState } from 'react';
import { Bell, Loader2, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_ROWS,
  type NotificationPrefs,
} from '@/lib/notification-prefs';
import { cn } from '@/lib/utils';
import { SectionHeader, StatusLine, LoadingPanel, type SaveState } from './shared';

export function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<SaveState>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/users/notification-preferences', { cache: 'no-store' });
      const json = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setState({ kind: 'error', message: json.error ?? 'Could not load preferences' });
        setPrefs(DEFAULT_NOTIFICATION_PREFS);
        return;
      }
      setPrefs(json.preferences as NotificationPrefs);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function set(key: keyof NotificationPrefs, value: boolean) {
    setPrefs((p) => (p ? { ...p, [key]: value } : p));
  }

  async function save() {
    if (!prefs) return;
    setSaving(true);
    setState(null);
    try {
      const res = await fetch('/api/users/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not save');
      setPrefs(json.preferences as NotificationPrefs);
      setState({ kind: 'ok', message: 'Preferences saved' });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not save' });
    } finally {
      setSaving(false);
    }
  }

  if (!prefs) return <LoadingPanel label="Loading preferences…" />;

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <SectionHeader
          code="N-02.03"
          title="Where Nexus should reach you"
          desc="Choose your channels per event type. Telegram rows only fire once your workspace has a bot connected and you have added your chat ID."
        />

        <div className="rounded-md border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_120px] gap-3 px-4 py-2.5 bg-[#0A0A0A] border-b border-border font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            <div>Event</div>
            <div className="text-center">Email</div>
            <div className="text-center">Telegram</div>
          </div>
          {NOTIFICATION_ROWS.map((row, i) => (
            <div
              key={row.label}
              className={cn(
                'grid grid-cols-[1fr_120px_120px] gap-3 px-4 py-3 items-center',
                i < NOTIFICATION_ROWS.length - 1 && 'border-b border-border'
              )}
            >
              <div>
                <div className="text-[13px] font-medium">{row.label}</div>
                <div className="text-[11px] text-muted-foreground">{row.desc}</div>
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={prefs[row.email]}
                  onCheckedChange={(v) => set(row.email, v)}
                  aria-label={`${row.label} by email`}
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={prefs[row.telegram]}
                  onCheckedChange={(v) => set(row.telegram, v)}
                  aria-label={`${row.label} by Telegram`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save preferences
          </Button>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <Bell className="size-3" />
            In-app feed always on
          </span>
          <StatusLine state={state} />
        </div>
      </CardContent>
    </Card>
  );
}
