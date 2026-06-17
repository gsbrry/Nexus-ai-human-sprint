'use client';
import { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Bot,
  Building2,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Mail,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
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
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { InviteDialog } from '@/components/settings/InviteDialog';
import { mockUsers, type MockRole } from '@/lib/mock/gbm';
import { cn } from '@/lib/utils';

const ROLE_LABEL: Record<MockRole, string> = {
  member: 'Member',
  scrum_master: 'Scrum master',
  org_admin: 'Org admin',
  super_admin: 'Super admin',
};

export default function SettingsPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
          N-02 / N-03 · Settings
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Your profile, your workspace, and the keys that let Nexus talk to the rest of the stack.
        </p>
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
          <ProfileTab />
        </TabsContent>
        <TabsContent value="org" className="mt-6">
          <OrgTab />
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <MembersTab />
        </TabsContent>
        <TabsContent value="keys" className="mt-6">
          <ApiKeysTab />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Profile (N-02)
// -----------------------------------------------------------------------------
function ProfileTab() {
  const me = mockUsers.find((u) => u.id === 'u-raphy')!;
  const [name, setName] = useState(me.name);
  const [bio, setBio] = useState('Founder · making humans + AI agents ship sprints together.');
  const [telegram, setTelegram] = useState('@raphyverdun');
  const [timezone, setTimezone] = useState('Europe/Zurich');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      <Card>
        <CardContent className="p-6 space-y-5">
          <SectionHeader code="N-02.01" title="Identity" desc="How you appear to teammates and AI agents." />

          <div className="flex items-center gap-4">
            <OwnerAvatar user={me} size={64} />
            <div>
              <Button variant="outline" size="sm" type="button">
                <RefreshCw className="size-3.5" />
                Change avatar
              </Button>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-1.5">
                PNG or JPG · up to 2&nbsp;MB
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={me.email} readOnly className="bg-[#0A0A0A] text-muted-foreground" />
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Managed by your IdP
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telegram">Telegram handle</Label>
              <Input
                id="telegram"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
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
              <span className="inline-flex items-center gap-1.5 text-[12px] text-gold font-mono uppercase tracking-[0.12em]">
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
              {ROLE_LABEL[me.role]}
            </Badge>
            <p className="text-[12px] text-muted-foreground">
              Org admins can change roles in the Members tab.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Danger zone
            </div>
            <Button variant="outline" size="sm" className="w-full justify-start text-destructive hover:bg-destructive/10">
              <Trash2 className="size-4" />
              Delete my account
            </Button>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Removes you from this workspace. Tasks reassigned to org admins.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Organisation (N-03)
// -----------------------------------------------------------------------------
function OrgTab() {
  const [orgName, setOrgName] = useState('NEXUS Studio');
  const [slug, setSlug] = useState('nexus');
  const [defaultProject, setDefaultProject] = useState('GBM');
  const [saved, setSaved] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      <Card>
        <CardContent className="p-6 space-y-5">
          <SectionHeader code="N-03.01" title="Workspace" desc="Everyone on your team sees these settings." />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Organisation name</Label>
              <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-slug">URL slug</Label>
              <div className="flex items-center rounded-md border border-border bg-[#0A0A0A] px-2 focus-within:border-gold/40">
                <span className="font-mono text-[11px] text-muted-foreground">nexus.dev/</span>
                <Input
                  id="org-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="default-project">Default project for new members</Label>
            <select
              id="default-project"
              value={defaultProject}
              onChange={(e) => setDefaultProject(e.target.value)}
              className="w-full rounded-md border border-border bg-[#0A0A0A] px-3 py-2 text-sm focus:outline-none focus:border-gold/40"
            >
              <option value="GBM">GBM · GBM Curriculum 2.0</option>
              <option value="NEX">NEX · NEXUS Platform</option>
            </select>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              New invites land here on first login.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2200);
              }}
            >
              <Save className="size-4" />
              Save organisation
            </Button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-gold font-mono uppercase tracking-[0.12em]">
                <CheckCircle2 className="size-3.5" />
                Saved
              </span>
            )}
          </div>

          <Separator />

          <SectionHeader
            code="N-03.02"
            title="Telegram bot"
            desc="Optional. Link a bot to deliver invite & notification pings to a group chat."
          />

          <div className="rounded-md border border-border bg-[#0A0A0A] p-4 flex items-start gap-3">
            <div className="size-9 rounded-full bg-blue/20 border border-blue/30 flex items-center justify-center">
              <Bot className="size-4 text-[#7AA7E0]" />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-medium">No bot linked</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Create one with @BotFather, then drop the token into the API keys tab.
              </div>
            </div>
            <Button variant="outline" size="sm">
              Link bot
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Workspace stats
          </div>
          <Stat label="Members" value="8" />
          <Stat label="Projects" value="2" />
          <Stat label="Sprints completed" value="14" tone="gold" />
          <Stat label="Tasks tracked" value="287" />
          <Separator />
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-destructive">
            Danger zone
          </div>
          <Button variant="outline" size="sm" className="w-full justify-start text-destructive hover:bg-destructive/10">
            <AlertTriangle className="size-4" />
            Archive workspace
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Members + Invites (N-03 / N-04)
// -----------------------------------------------------------------------------
type Invite = { email: string; role: MockRole; sent_at: string };

function MembersTab() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [members, setMembers] = useState(mockUsers);
  const [invites, setInvites] = useState<Invite[]>([
    { email: 'nina.torres@nexus.dev', role: 'scrum_master', sent_at: '2025-06-09' },
    { email: 'dev.contractor@external.co', role: 'member', sent_at: '2025-06-10' },
  ]);

  function onInviteSent(emails: string[], role: MockRole) {
    setInvites((prev) => [
      ...emails.map((e) => ({ email: e, role, sent_at: '2025-06-11' })),
      ...prev,
    ]);
  }

  function changeRole(id: string, role: MockRole) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
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
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" />
              Invite teammates
            </Button>
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <div className="grid grid-cols-[1fr_180px_140px_60px] gap-3 px-4 py-2.5 bg-[#0A0A0A] border-b border-border font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              <div>Member</div>
              <div>Email</div>
              <div>Role</div>
              <div className="text-right">Actions</div>
            </div>
            {members.map((m) => (
              <div
                key={m.id}
                className="grid grid-cols-[1fr_180px_140px_60px] gap-3 px-4 py-3 border-b border-border last:border-b-0 items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <OwnerAvatar user={m} size={32} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate">{m.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                      {m.initials}
                    </div>
                  </div>
                </div>
                <div className="font-mono text-[11px] text-muted-foreground truncate">{m.email}</div>
                <div>
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value as MockRole)}
                    className="rounded-md border border-border bg-[#0A0A0A] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-foreground"
                  >
                    {(['member', 'scrum_master', 'org_admin'] as MockRole[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-right">
                  <button
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-end justify-between mb-4">
            <SectionHeader
              code="N-04.01"
              title={`Pending invites · ${invites.length}`}
              desc="Magic links expire 7 days after sending."
            />
            {invites.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setInvites([])}>
                Revoke all
              </Button>
            )}
          </div>

          {invites.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
              No pending invites. Click <span className="text-foreground">Invite teammates</span> to send one.
            </div>
          ) : (
            <div className="space-y-2">
              {invites.map((inv) => (
                <div
                  key={inv.email}
                  className="flex items-center justify-between rounded-md border border-border bg-[#0A0A0A] px-4 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                      <Mail className="size-4 text-gold" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">{inv.email}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        Sent {inv.sent_at} · {ROLE_LABEL[inv.role]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm">
                      <Send className="size-3.5" />
                      Resend
                    </Button>
                    <button
                      className="text-muted-foreground hover:text-destructive p-1.5"
                      onClick={() => setInvites((prev) => prev.filter((i) => i.email !== inv.email))}
                      aria-label="Revoke invite"
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

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} onInvite={onInviteSent} />
    </div>
  );
}

// -----------------------------------------------------------------------------
// API keys (N-02 / N-03)
// -----------------------------------------------------------------------------
function ApiKeysTab() {
  return (
    <div className="space-y-4">
      <Alert className="border-gold/30 bg-gold/[0.04]">
        <Sparkles className="size-4 text-gold" />
        <AlertDescription className="text-[12px]">
          Keys are stored encrypted at rest. They never leave your workspace and aren&apos;t shared with AI agents
          beyond what each integration explicitly requires.
        </AlertDescription>
      </Alert>

      <KeyCard
        code="N-02.02"
        icon={<Sparkles className="size-4 text-[#9C7DD6]" />}
        title="Anthropic Claude"
        desc="Used by every AI agent in your workspace. Required for prompt generation, RAG, and the grader."
        placeholder="sk-ant-api03-…"
        prefilled="sk-ant-api03-•••••••••••••••••••••••3kQ"
        helper="Get a key at console.anthropic.com → API keys."
      />
      <KeyCard
        code="N-03.04"
        icon={<Mail className="size-4 text-[#7DC8B8]" />}
        title="Resend"
        desc="Transactional email for invites and digest emails."
        placeholder="re_…"
        helper="resend.com → API keys. Use one with full send scope."
      />
      <KeyCard
        code="N-03.05"
        icon={<Bot className="size-4 text-[#7AA7E0]" />}
        title="Telegram bot token"
        desc="Mirrors notifications & invite pings into your org chat."
        placeholder="123456:ABC-DEF…"
        helper="Talk to @BotFather → /newbot to mint a token."
      />
    </div>
  );
}

function KeyCard({
  code,
  icon,
  title,
  desc,
  placeholder,
  helper,
  prefilled,
}: {
  code: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  placeholder: string;
  helper: string;
  prefilled?: string;
}) {
  const [value, setValue] = useState(prefilled ?? '');
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(Boolean(prefilled));
  const masked = !show && value.length > 10 ? value.slice(0, 12) + '•'.repeat(Math.max(0, value.length - 16)) + value.slice(-4) : value;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-md bg-card border border-border flex items-center justify-center">
              {icon}
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">{code}</div>
              <div className="text-[14px] font-bold">{title}</div>
              <p className="text-[12px] text-muted-foreground max-w-[640px] mt-0.5">{desc}</p>
            </div>
          </div>
          {saved && (
            <Badge variant="gold" className="font-mono">
              <CheckCircle2 className="size-3" />
              Connected
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center rounded-md border border-border bg-[#0A0A0A] px-2 focus-within:border-gold/40">
            <Key className="size-3.5 text-muted-foreground ml-1" />
            <Input
              value={show ? value : masked}
              onChange={(e) => {
                setValue(e.target.value);
                setSaved(false);
              }}
              placeholder={placeholder}
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
          <Button
            onClick={() => {
              setSaved(true);
            }}
            disabled={!value.trim() || saved}
          >
            {saved ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-2">
          {helper}
        </p>
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Notifications preferences
// -----------------------------------------------------------------------------
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
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
  });

  function set<K extends keyof typeof prefs>(key: K, value: boolean) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <SectionHeader
          code="N-02.03"
          title="Where Nexus should reach you"
          desc="Choose your channels per event type. AI agent activity follows the mention rules."
        />

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
            onEmail={(v) => set('mentions_email', v)}
            onTelegram={(v) => set('mentions_telegram', v)}
          />
          <PrefRow
            label="Assigned to me"
            desc="A task is assigned to you or its sprint changes."
            email={prefs.assigned_email}
            telegram={prefs.assigned_telegram}
            onEmail={(v) => set('assigned_email', v)}
            onTelegram={(v) => set('assigned_telegram', v)}
          />
          <PrefRow
            label="Blockers raised"
            desc="Any task in your projects is flagged blocked."
            email={prefs.blocker_email}
            telegram={prefs.blocker_telegram}
            onEmail={(v) => set('blocker_email', v)}
            onTelegram={(v) => set('blocker_telegram', v)}
          />
          <PrefRow
            label="Sprint events"
            desc="Sprint starts, closes, or hits a milestone."
            email={prefs.sprint_email}
            telegram={prefs.sprint_telegram}
            onEmail={(v) => set('sprint_email', v)}
            onTelegram={(v) => set('sprint_telegram', v)}
          />
          <PrefRow
            label="Daily digest"
            desc="One round-up at 09:00 your local time."
            email={prefs.digest_email}
            telegram={prefs.digest_telegram}
            onEmail={(v) => set('digest_email', v)}
            onTelegram={(v) => set('digest_telegram', v)}
            last
          />
        </div>

        <div className="flex items-center gap-3">
          <Button>
            <Save className="size-4" />
            Save preferences
          </Button>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
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

// -----------------------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------------------
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
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">{code}</div>
      <div className="text-base font-bold tracking-tight">{title}</div>
      {desc && <p className="text-[12px] text-muted-foreground mt-1 max-w-[640px]">{desc}</p>}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'gold' }) {
  return (
    <div className="flex items-center justify-between">
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          'font-mono text-[18px] font-extrabold tracking-tight',
          tone === 'gold' && 'text-gold'
        )}
      >
        {value}
      </div>
    </div>
  );
}
