'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Topbar({
  title,
  email,
  fullName,
}: {
  title: string;
  email?: string | null;
  fullName?: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
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
    <header className="flex items-center justify-between border-b border-border bg-[#0A0A0A] px-6 py-3 h-[60px]">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Workspace
        </div>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>
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
    </header>
  );
}
