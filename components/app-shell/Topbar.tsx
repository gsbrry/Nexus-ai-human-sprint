'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import { Logo } from '@/components/brand/Logo';
import { NavList } from '@/components/app-shell/Sidebar';
import { RoleSwitch } from '@/components/app-shell/RoleSwitch';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function Topbar({
  title,
  email,
  fullName,
  role,
  previewMode = false,
}: {
  title: string;
  email?: string | null;
  fullName?: string | null;
  role?: 'member' | 'scrum_master' | 'org_admin' | 'super_admin';
  previewMode?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const initials =
    (fullName ?? email ?? 'U')
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'U';

  function onLogout() {
    startTransition(async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{fullName || email || 'Account'}</DropdownMenuLabel>
            {email && fullName && (
              <div className="px-2 pb-1 text-[11px] text-muted-foreground">{email}</div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User className="size-4" /> Profile &amp; settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
