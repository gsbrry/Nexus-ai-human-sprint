import { redirect } from 'next/navigation';
import { Database } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RealSettingsClient } from './RealSettingsClient';

type Member = {
  id: string;
  user_id: string;
  role: string;
  profiles:
    | { id: string; full_name: string | null; email: string; avatar_url: string | null }
    | Array<{ id: string; full_name: string | null; email: string; avatar_url: string | null }>
    | null;
};

export async function RealSettings() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch profile + primary org membership + org members in parallel.
  const [{ data: profile, error: profileErr }, { data: membership, error: membershipErr }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, telegram_chat_id, timezone, metadata, anthropic_api_key')
        .eq('id', user.id)
        .single(),
      supabase
        .from('org_members')
        .select('id, org_id, role, organisations(id, name, slug, settings)')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle(),
    ]);

  if (profileErr || membershipErr) {
    return (
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 md:px-8 py-12">
        <Alert variant="destructive">
          <Database className="size-4" />
          <AlertTitle>Supabase error</AlertTitle>
          <AlertDescription className="font-mono text-[11px] mt-1">
            {profileErr?.message ?? membershipErr?.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!membership?.org_id) {
    return (
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 md:px-8 py-12">
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              No workspace yet
            </div>
            <div className="text-base font-bold">Run the /setup wizard first</div>
            <p className="text-sm text-muted-foreground">
              You need at least one organisation before opening settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orgRaw = membership.organisations;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as {
    id: string;
    name: string;
    slug: string;
    settings: Record<string, unknown> | null;
  } | null;

  const { data: members } = await supabase
    .from('org_members')
    .select('id, user_id, role, profiles(id, full_name, email, avatar_url)')
    .eq('org_id', membership.org_id)
    .is('deleted_at', null)
    .order('joined_at', { ascending: true });

  // Normalise members shape
  const normalisedMembers = ((members ?? []) as Member[]).map((m) => {
    const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      full_name: p?.full_name ?? p?.email ?? '—',
      email: p?.email ?? '',
      avatar_url: p?.avatar_url ?? null,
    };
  });

  // Mask API keys before shipping to the client.
  const meta = (profile?.metadata ?? {}) as Record<string, string | undefined>;
  const initialKeys = {
    anthropic: maskKey(profile?.anthropic_api_key),
    resend: maskKey(meta.resend_api_key),
    telegram: maskKey(meta.telegram_bot_token),
  };

  return (
    <RealSettingsClient
      profile={{
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name ?? '',
        avatar_url: profile.avatar_url,
        role: profile.role,
        timezone: profile.timezone ?? 'UTC',
        telegram_chat_id: profile.telegram_chat_id ?? '',
        bio: (meta.bio as string | undefined) ?? '',
        telegram_handle: (meta.telegram_handle as string | undefined) ?? '',
        notification_prefs:
          (meta.notification_prefs as Record<string, boolean> | undefined) ?? DEFAULT_PREFS,
      }}
      org={org}
      viewerRole={membership.role}
      members={normalisedMembers}
      initialKeys={initialKeys}
    />
  );
}

const DEFAULT_PREFS: Record<string, boolean> = {
  mentions_email: true,
  mentions_telegram: true,
  assigned_email: true,
  assigned_telegram: false,
  blocker_email: true,
  blocker_telegram: true,
  sprint_email: true,
  sprint_telegram: false,
  digest_email: true,
  digest_telegram: false,
};

function maskKey(v: string | null | undefined): string | null {
  if (!v) return null;
  if (v.length <= 16) return '••••••••';
  return v.slice(0, 6) + '•'.repeat(Math.min(20, v.length - 10)) + v.slice(-4);
}
