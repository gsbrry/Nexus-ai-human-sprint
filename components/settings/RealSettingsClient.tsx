'use client';
import { useState } from 'react';
import {
  Bell,
  Bot,
  CheckCircle2,
  Copy,
  Database,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Mail,
  Save,
  Send,
  Sparkles,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InviteDialog } from '@/components/settings/InviteDialog';
import { cn } from '@/lib/utils';

const ROLE_LABEL: Record<string, string> = {
  member: 'Member',
  scrum_master: 'Scrum master',
  org_admin: 'Org admin',
  super_admin: 'Super admin',
};

type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  timezone: string;
  telegram_chat_id: string;
  bio: string;
  telegram_handle: string;
  notification_prefs: Record<string, boolean>;
};

type Org = {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown> | null;
} | null;

type Member = {
  id: string;
  user_id: string;
  role: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
};

type InitialKeys = {
  anthropic: string | null;
  resend: string | null;
  telegram: string | null;
};

export function RealSettingsClient({
  profile,
  org,
  viewerRole,
  members,
  initialKeys,
}: {
  profile: Profile;
  org: Org;
  viewerRole: string;
  members: Member[];
  initialKeys: InitialKeys;
}) {
  const canAdmin = viewerRole === 'org_admin' || viewerRole === 'super_admin';

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            N-02 / N-03 · Settings
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Your profile, your workspace, and the keys that let Nexus talk to the rest of the stack.
          </p>
        </div>
        <Badge variant="gold" className="font-mono">
          <Database className="size-3" />
          Real DB
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="org">Organisation</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="keys">API keys</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab profile={profile} />
        </TabsContent>
        <TabsContent value="org" className="mt-6">
          <OrgTab org={org} canAdmin={canAdmin} />
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <MembersTab members={members} canAdmin={canAdmin} />
        </TabsContent>
        <TabsContent value="keys" className="mt-6">
          <ApiKeysTab initialKeys={initialKeys} />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab initial={profile.notification_prefs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile tab — saves to profiles table
// ---------------------------------------------------------------------------
function ProfileTab({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [bio, setBio] = useState(profile.bio);
  const [telegramHandle, setTelegramHandle] = useState(profile.telegram_handle);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          timezone,
          bio,
          telegram_handle: telegramHandle,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
    setSaving(false);
  }

  const initials = (fullName || profile.email || '??')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      <Card>
        <CardContent className="p-6 space-y-5">
          <SectionHeader code="N-02.01" title="Identity" desc="How you appear to teammates and AI agents." />
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-mono text-lg font-bold text-primary">
              {initials}
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Avatar syncs from your Google profile
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile.email}
                readOnly
                className="bg-[#0A0A0A] text-muted-foreground"
              />
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Managed by your IdP
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telegram">Telegram handle</Label>
              <Input
                id="telegram"
                value={telegramHandle}
                onChange={(e) => setTelegramHandle(e.target.value)}
                placeholder="@yourname"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tz">Timezone</Label>
              <Input id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save changes
            </Button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-primary font-mono uppercase tracking-[0.12em]">
                <CheckCircle2 className="size-3.5" />
                Saved
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Current role
            </div>
            <Badge variant="gold" className="font-mono">
              {ROLE_LABEL[profile.role] ?? profile.role}
            </Badge>
            <p className="text-[12px] text-muted-foreground">
              Org admins can change roles in the Members tab.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Org tab — saves to organisations table
// ---------------------------------------------------------------------------
function OrgTab({ org, canAdmin }: { org: Org; canAdmin: boolean }) {
  const [name, setName] = useState(org?.name ?? '');
  const [slug, setSlug] = useState(org?.slug ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!org) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/orgs/${org.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
    setSaving(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      <Card>
        <CardContent className="p-6 space-y-5">
          <SectionHeader code="N-03.01" title="Workspace" desc="Everyone on your team sees these settings." />
          {!canAdmin && (
            <Alert>
              <AlertDescription>Read-only. Only org admins can edit workspace fields.</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Organisation name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canAdmin}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-slug">URL slug</Label>
              <div className="flex items-center rounded-md border border-border bg-[#0A0A0A] px-2 focus-within:border-primary/40">
                <span className="font-mono text-[11px] text-muted-foreground">nexus.dev/</span>
                <Input
                  id="org-slug"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }
                  disabled={!canAdmin}
                  className="border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving || !canAdmin}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save organisation
            </Button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-primary font-mono uppercase tracking-[0.12em]">
                <CheckCircle2 className="size-3.5" />
                Saved
              </span>
            )}
          </div>

          <Separator />

          <SectionHeader
            code="N-03.02"
            title="Telegram bot"
            desc="Optional. Add the bot token in the API keys tab to enable notification pings."
          />
          <div className="rounded-md border border-border bg-[#0A0A0A] p-4 flex items-start gap-3">
            <div className="size-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Bot className="size-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-medium">Bot token lives on your profile</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Head to API keys → Telegram bot token to link one.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Workspace ID
          </div>
          <code className="block font-mono text-[10px] break-all bg-[#0A0A0A] rounded-md border border-border p-2">
            {org?.id}
          </code>
          <p className="text-[11px] text-muted-foreground">
            Use this ID when configuring integrations that scope to your org.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Members tab — lists org_members, PATCH role, DELETE membership
// ---------------------------------------------------------------------------
function MembersTab({ members: initial, canAdmin }: { members: Member[]; canAdmin: boolean }) {
  const [members, setMembers] = useState(initial);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeRole(id: string, role: string) {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/org-members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    }
    setPendingId(null);
  }

  async function removeMember(id: string) {
    if (!confirm('Remove this member from the workspace?')) return;
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/org-members/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
    setPendingId(null);
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
            <SectionHeader
              code="N-03.03"
              title={`Members · ${members.length}`}
              desc="Anyone with workspace access. Promote, demote, or remove."
            />
            <Button onClick={() => setInviteOpen(true)} disabled={!canAdmin}>
              <UserPlus className="size-4" />
              Invite teammates
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_180px_140px_60px] gap-3 px-4 py-2.5 bg-[#0A0A0A] border-b border-border font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              <div>Member</div>
              <div>Email</div>
              <div>Role</div>
              <div className="text-right">Actions</div>
            </div>
            {members.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No members yet.
              </div>
            ) : (
              members.map((m) => (
                <div
                  key={m.id}
                  className="grid grid-cols-[1fr_180px_140px_60px] gap-3 px-4 py-3 border-b border-border last:border-b-0 items-center"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MemberAvatar name={m.full_name} url={m.avatar_url} />
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">{m.full_name}</div>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground truncate">
                    {m.email}
                  </div>
                  <div>
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m.id, e.target.value)}
                      disabled={!canAdmin || pendingId === m.id || m.role === 'super_admin'}
                      className="rounded-md border border-border bg-[#0A0A0A] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-foreground disabled:opacity-50"
                    >
                      {['member', 'scrum_master', 'org_admin'].map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                      {m.role === 'super_admin' && (
                        <option value="super_admin">Super admin</option>
                      )}
                    </select>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => removeMember(m.id)}
                      disabled={!canAdmin || pendingId === m.id}
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                      aria-label="Remove"
                    >
                      {pendingId === m.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={() => {
          // No-op: the real invite flow persists via Resend. Members appear
          // in this list after the invitee accepts and completes profile-setup.
        }}
      />
    </div>
  );
}

function MemberAvatar({ name, url }: { name: string; url: string | null }) {
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className="size-8 rounded-full object-cover" />;
  }
  return (
    <div className="size-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-mono text-[10px] font-bold text-primary">
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// API keys tab — saves to profiles.anthropic_api_key + profiles.metadata
// ---------------------------------------------------------------------------
function ApiKeysTab({ initialKeys }: { initialKeys: InitialKeys }) {
  return (
    <div className="space-y-4">
      <Alert className="border-primary/30 bg-primary/[0.04]">
        <Sparkles className="size-4 text-primary" />
        <AlertDescription className="text-[12px]">
          Keys are stored on your profile row (RLS-protected). They never leave your workspace and
          are never returned to the browser in plaintext after saving.
        </AlertDescription>
      </Alert>

      <KeyCard
        field="anthropic_api_key"
        code="N-02.02"
        icon={<Sparkles className="size-4 text-[#9C7DD6]" />}
        title="Anthropic Claude"
        desc="Used by every AI agent in your workspace. Required for prompt generation and RAG."
        placeholder="sk-ant-api03-…"
        helper="Get a key at console.anthropic.com → API keys."
        initialMask={initialKeys.anthropic}
      />
      <KeyCard
        field="resend_api_key"
        code="N-03.04"
        icon={<Mail className="size-4 text-[#7DC8B8]" />}
        title="Resend"
        desc="Transactional email for invites and digest emails."
        placeholder="re_…"
        helper="resend.com → API keys. Use one with full send scope."
        initialMask={initialKeys.resend}
      />
      <KeyCard
        field="telegram_bot_token"
        code="N-03.05"
        icon={<Bot className="size-4 text-[#7AA7E0]" />}
        title="Telegram bot token"
        desc="Mirrors notifications & invite pings into your org chat."
        placeholder="123456:ABC-DEF…"
        helper="Talk to @BotFather → /newbot to mint a token."
        initialMask={initialKeys.telegram}
      />
    </div>
  );
}

function KeyCard({
  field,
  code,
  icon,
  title,
  desc,
  placeholder,
  helper,
  initialMask,
}: {
  field: 'anthropic_api_key' | 'resend_api_key' | 'telegram_bot_token';
  code: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  placeholder: string;
  helper: string;
  initialMask: string | null;
}) {
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMask, setSavedMask] = useState<string | null>(initialMask);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/users/me/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setSaved(true);
      setValue('');
      setSavedMask(value ? mask(value) : null);
      setTimeout(() => setSaved(false), 2400);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
    setSaving(false);
  }

  const display = show ? value : mask(value);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-md bg-card border border-border flex items-center justify-center">
              {icon}
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{code}</div>
              <div className="text-[14px] font-bold">{title}</div>
              <p className="text-[12px] text-muted-foreground max-w-[640px] mt-0.5">{desc}</p>
              {savedMask && (
                <div className="font-mono text-[10px] text-muted-foreground mt-1">
                  Currently saved: <span className="text-primary">{savedMask}</span>
                </div>
              )}
            </div>
          </div>
          {savedMask && !value && (
            <Badge variant="gold" className="font-mono">
              <CheckCircle2 className="size-3" />
              Connected
            </Badge>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center rounded-md border border-border bg-[#0A0A0A] px-2 focus-within:border-primary/40">
            <Key className="size-3.5 text-muted-foreground ml-1" />
            <Input
              value={display}
              onChange={(e) => setValue(e.target.value)}
              placeholder={savedMask ? 'Paste a new key to replace…' : placeholder}
              className="border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-[12px]"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="text-muted-foreground hover:text-foreground p-1"
              aria-label="Toggle reveal"
            >
              {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(value)}
              className="text-muted-foreground hover:text-foreground p-1"
              aria-label="Copy"
            >
              <Copy className="size-3.5" />
            </button>
          </div>
          <Button onClick={save} disabled={saving || !value.trim()}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Save className="size-4" />
            )}
            {saved ? 'Saved' : 'Save'}
          </Button>
          {savedMask && !value && (
            <Button
              variant="outline"
              onClick={async () => {
                if (!confirm('Clear this key?')) return;
                setSaving(true);
                await fetch('/api/users/me/api-keys', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ [field]: '' }),
                });
                setSavedMask(null);
                setSaving(false);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-2">
          {helper}
        </p>
      </CardContent>
    </Card>
  );
}

function mask(v: string): string {
  if (!v) return '';
  if (v.length <= 10) return '•'.repeat(v.length);
  return v.slice(0, 6) + '•'.repeat(Math.min(20, v.length - 10)) + v.slice(-4);
}

// ---------------------------------------------------------------------------
// Notifications tab — saves prefs into profiles.metadata.notification_prefs
// ---------------------------------------------------------------------------
function NotificationsTab({ initial }: { initial: Record<string, boolean> }) {
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setKey(key: string, value: boolean) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_prefs: prefs }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <SectionHeader
          code="N-02.03"
          title="Where Nexus should reach you"
          desc="Choose your channels per event type. AI agent activity follows the mention rules."
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-md border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_120px] gap-3 px-4 py-2.5 bg-[#0A0A0A] border-b border-border font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            <div>Event</div>
            <div className="text-center">Email</div>
            <div className="text-center">Telegram</div>
          </div>
          <PrefRow
            label="Mentions"
            desc="You are @mentioned in a comment or task."
            email={prefs.mentions_email}
            telegram={prefs.mentions_telegram}
            onEmail={(v) => setKey('mentions_email', v)}
            onTelegram={(v) => setKey('mentions_telegram', v)}
          />
          <PrefRow
            label="Assigned to me"
            desc="A task is assigned to you or its sprint changes."
            email={prefs.assigned_email}
            telegram={prefs.assigned_telegram}
            onEmail={(v) => setKey('assigned_email', v)}
            onTelegram={(v) => setKey('assigned_telegram', v)}
          />
          <PrefRow
            label="Blockers raised"
            desc="Any task in your projects is flagged blocked."
            email={prefs.blocker_email}
            telegram={prefs.blocker_telegram}
            onEmail={(v) => setKey('blocker_email', v)}
            onTelegram={(v) => setKey('blocker_telegram', v)}
          />
          <PrefRow
            label="Sprint events"
            desc="Sprint starts, closes, or hits a milestone."
            email={prefs.sprint_email}
            telegram={prefs.sprint_telegram}
            onEmail={(v) => setKey('sprint_email', v)}
            onTelegram={(v) => setKey('sprint_telegram', v)}
          />
          <PrefRow
            label="Daily digest"
            desc="One round-up at 09:00 your local time."
            email={prefs.digest_email}
            telegram={prefs.digest_telegram}
            onEmail={(v) => setKey('digest_email', v)}
            onTelegram={(v) => setKey('digest_telegram', v)}
            last
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save preferences
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-primary font-mono uppercase tracking-[0.12em]">
              <CheckCircle2 className="size-3.5" />
              Saved
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground ml-auto">
            <Bell className="size-3" />
            In-app feed always on
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PrefRow({
  label,
  desc,
  email,
  telegram,
  onEmail,
  onTelegram,
  last,
}: {
  label: string;
  desc: string;
  email: boolean;
  telegram: boolean;
  onEmail: (v: boolean) => void;
  onTelegram: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_120px_120px] gap-3 px-4 py-3 items-center',
        !last && 'border-b border-border'
      )}
    >
      <div>
        <div className="text-[13px] font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <div className="flex justify-center">
        <Switch checked={email} onCheckedChange={onEmail} />
      </div>
      <div className="flex justify-center">
        <Switch checked={telegram} onCheckedChange={onTelegram} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function SectionHeader({
  code,
  title,
  desc,
}: {
  code: string;
  title: string;
  desc?: string;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{code}</div>
      <div className="text-base font-bold tracking-tight">{title}</div>
      {desc && <p className="text-[12px] text-muted-foreground mt-1 max-w-[640px]">{desc}</p>}
    </div>
  );
}

// Unused named exports here just prevent "Send" tree-shake if reintroduced later.
void Send;
