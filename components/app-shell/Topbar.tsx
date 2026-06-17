'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, User, Users, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetHeader,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Logo } from '@/components/brand/Logo';
import { NavList } from '@/components/app-shell/Sidebar';
import { RoleSwitch } from '@/components/app-shell/RoleSwitch';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { OwnerAvatar } from '@/components/tasks/OwnerBadge';
import { mockUsers, type MockUser } from '@/lib/mock/gbm';
import { cn } from '@/lib/utils';

const ROLE_LABEL: Record<MockUser['role'], string> = {
  member: 'Member',
  scrum_master: 'Scrum master',
  org_admin: 'Org admin',
  super_admin: 'Super admin',
};

const ROLE_VARIANT: Record<MockUser['role'], 'default' | 'blue' | 'gold' | 'teal'> = {
  member: 'default',
  scrum_master: 'blue',
  org_admin: 'gold',
  super_admin: 'teal',
};

export function Topbar({
  title,
  email,
  fullName,
  role,
  previewMode = false,
  demoActive = false,
}: {
  title: string;
  email?: string | null;
  fullName?: string | null;
  role?: 'member' | 'scrum_master' | 'org_admin' | 'super_admin';
  previewMode?: boolean;
  demoActive?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const initials =
    (fullName ?? email ?? 'U')
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'U';

  function onLogout() {
    startTransition(async () => {
      if (demoActive) {
        await fetch('/api/auth/demo', { method: 'DELETE' });
      } else {
        await fetch('/api/auth/logout', { method: 'POST' });
      }
      router.push('/login');
      router.refresh();
    });
  }

  function switchTo(userId: string) {
    startTransition(async () => {
      await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      setSwitcherOpen(false);
      router.refresh();
    });
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-[#0A0A0A] px-4 md:px-6 py-3 h-[60px]">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -ml-2"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <SheetContent side="left" className="p-0 bg-[#0A0A0A]">
            <SheetHeader className="px-5 py-5 border-b border-border">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Logo />
            </SheetHeader>
            <NavList role={role} onItemClick={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Workspace
          </div>
          <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
        </div>

        {demoActive && (
          <Badge
            variant="gold"
            className="font-mono ml-3 hidden md:inline-flex cursor-pointer hover:bg-gold/20"
            onClick={() => setSwitcherOpen(true)}
          >
            <Sparkles className="size-3" />
            Demo · {fullName?.split(' ')[0] ?? 'Guest'}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        {previewMode && <RoleSwitch />}
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full">
            <Avatar className="size-9">
              <AvatarFallback className="bg-gold/20 text-gold border border-gold/30">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>{fullName || email || 'Account'}</DropdownMenuLabel>
            {email && fullName && (
              <div className="px-2 pb-1 text-[11px] text-muted-foreground">{email}</div>
            )}
            <DropdownMenuSeparator />
            {demoActive && (
              <DropdownMenuItem onClick={() => setSwitcherOpen(true)}>
                <Users className="size-4" /> Switch demo user
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User className="size-4" /> Profile &amp; settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
              <LogOut className="size-4" />
              {demoActive ? 'Exit demo mode' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Demo user switcher dialog */}
      <Dialog open={switcherOpen} onOpenChange={setSwitcherOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
              Demo mode · switch user
            </div>
            <DialogTitle>Jump in as another teammate</DialogTitle>
            <DialogDescription>
              Pick anyone on the GBM team. The whole app refreshes with their tasks, role, and
              notifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 max-h-[420px] overflow-y-auto -mx-1 px-1">
            {mockUsers.map((u) => {
              const isCurrent = u.email === email;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => switchTo(u.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors',
                    isCurrent
                      ? 'border-gold/40 bg-gold/[0.06]'
                      : 'border-border bg-[#0A0A0A] hover:border-gold/30'
                  )}
                >
                  <OwnerAvatar user={u} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold truncate">{u.name}</span>
                      {isCurrent && (
                        <Badge variant="gold" className="font-mono">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                      {u.email}
                    </div>
                  </div>
                  <Badge variant={ROLE_VARIANT[u.role]} className="font-mono shrink-0">
                    {ROLE_LABEL[u.role]}
                  </Badge>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
