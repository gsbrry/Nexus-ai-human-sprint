'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogIn, Sparkles, UserCog } from 'lucide-react';
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

export function DemoLoginCard({ defaultUserId = 'u-raphy' }: { defaultUserId?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string>(defaultUserId);
  const [open, setOpen] = useState(false);
  const selected = mockUsers.find((u) => u.id === selectedId) ?? mockUsers[0];

  function enter(userId: string) {
    startTransition(async () => {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-gold/[0.04] p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-md bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0">
          <Sparkles className="size-4 text-gold" />
        </div>
        <div className="flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
            Demo mode
          </div>
          <div className="text-[14px] font-bold leading-snug">Skip auth, jump in as anyone</div>
          <p className="text-[12px] text-muted-foreground mt-1">
            Pick a teammate to see every screen with their tasks, role, and notifications. Real auth
            still works in parallel.
          </p>
        </div>
      </div>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full flex items-center justify-between rounded-md border border-border bg-[#0A0A0A]',
              'px-3 py-2.5 transition-colors hover:border-gold/30 focus:outline-none focus:border-gold/40'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <OwnerAvatar user={selected} size={32} />
              <div className="text-left min-w-0">
                <div className="text-[13px] font-semibold truncate">{selected.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  {selected.email}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={ROLE_VARIANT[selected.role]} className="font-mono">
                {ROLE_LABEL[selected.role]}
              </Badge>
              <ChevronDown className="size-4 text-muted-foreground" />
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[360px] overflow-y-auto"
        >
          <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            GBM team · {mockUsers.length} members
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {mockUsers.map((u) => (
            <DropdownMenuItem
              key={u.id}
              onClick={() => setSelectedId(u.id)}
              className="flex items-center gap-3 cursor-pointer py-2"
            >
              <OwnerAvatar user={u} size={28} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{u.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  {u.email}
                </div>
              </div>
              <Badge variant={ROLE_VARIANT[u.role]} className="font-mono shrink-0">
                {ROLE_LABEL[u.role]}
              </Badge>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px] text-muted-foreground py-1.5">
            Tip: switch user any time from the topbar avatar menu.
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button type="button" className="w-full" onClick={() => enter(selected.id)} disabled={pending}>
        <LogIn className="size-4" />
        {pending ? 'Loading…' : `Enter as ${selected.name.split(' ')[0]}`}
      </Button>

      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground text-center inline-flex items-center gap-1.5 justify-center w-full">
        <UserCog className="size-3" />
        No Supabase signup required
      </p>
    </div>
  );
}
