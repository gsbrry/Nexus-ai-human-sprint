'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceStrict } from 'date-fns';
import {
  AtSign,
  Bell,
  BellOff,
  CheckCheck,
  CircleAlert,
  Sparkles,
  Target,
  UserPlus,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  groupNotifications,
  mockNotifications,
  type MockNotifKind,
  type MockNotification,
} from '@/lib/mock/notifications';

// Anchored to the GBM demo "now" so timestamps stay readable across reloads.
const DEMO_NOW = new Date('2025-06-11T16:30:00Z');

const FILTERS: { value: 'all' | MockNotifKind | 'mentions'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mentions', label: 'Mentions' },
  { value: 'ai', label: 'AI' },
  { value: 'system', label: 'System' },
];

const KIND_META: Record<MockNotifKind, { icon: LucideIcon; color: string; label: string }> = {
  mention: { icon: AtSign, color: '#1a73e8', label: 'mention' },
  ai: { icon: Sparkles, color: '#9C7DD6', label: 'ai' },
  system: { icon: Wand2, color: '#7DC8B8', label: 'system' },
  assigned: { icon: UserPlus, color: '#4a90e8', label: 'assigned' },
  blocker: { icon: CircleAlert, color: '#F09595', label: 'blocker' },
  sprint: { icon: Target, color: '#7AA7E0', label: 'sprint' },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MockNotification[]>(mockNotifications);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all');

  const unread = items.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'mentions') return items.filter((n) => n.kind === 'mention');
    return items.filter((n) => n.kind === filter);
  }, [items, filter]);

  const { today, earlier } = groupNotifications(filtered);

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markOne(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="relative inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-gold hover:border-gold/30 transition-colors"
          aria-label="Open notifications"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-gold text-dark text-[10px] font-bold font-mono px-1 ring-2 ring-[#0A0A0A]">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[440px] p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                N-01 · Notifications
              </div>
              <SheetTitle className="text-lg font-bold">Activity</SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              disabled={unread === 0}
              className="text-[11px] font-mono uppercase tracking-[0.1em]"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          </div>
          <SheetDescription className="sr-only">Recent activity across your workspace.</SheetDescription>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {FILTERS.map((f) => {
              const active = filter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    'inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors',
                    active
                      ? 'border-gold/40 bg-gold/10 text-gold'
                      : 'border-border bg-[#0A0A0A] text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="px-6 py-16 flex flex-col items-center justify-center text-center text-muted-foreground">
              <div className="size-12 rounded-full bg-card border border-border flex items-center justify-center mb-3">
                <BellOff className="size-5" />
              </div>
              <div className="text-sm font-medium text-foreground">No notifications</div>
              <div className="text-xs mt-1">You’re all caught up.</div>
            </div>
          ) : (
            <div className="py-2">
              {today.length > 0 && (
                <Section label="Today" items={today} onClick={(id) => markOne(id)} onClose={() => setOpen(false)} />
              )}
              {earlier.length > 0 && (
                <Section label="Earlier" items={earlier} onClick={(id) => markOne(id)} onClose={() => setOpen(false)} />
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  label,
  items,
  onClick,
  onClose,
}: {
  label: string;
  items: MockNotification[];
  onClick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="sticky top-0 bg-card/95 backdrop-blur px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
        {label}
      </div>
      <ul>
        {items.map((n) => (
          <NotificationRow key={n.id} n={n} onClick={onClick} onClose={onClose} />
        ))}
      </ul>
    </div>
  );
}

function NotificationRow({
  n,
  onClick,
  onClose,
}: {
  n: MockNotification;
  onClick: (id: string) => void;
  onClose: () => void;
}) {
  const meta = KIND_META[n.kind];
  const Icon = meta.icon;
  const Inner = (
    <div
      className={cn(
        'group flex items-start gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-white/[0.02] transition-colors',
        !n.read && 'bg-gold/[0.025]'
      )}
    >
      <div
        className="shrink-0 mt-0.5 size-8 rounded-full flex items-center justify-center text-[11px] font-bold font-mono ring-1 ring-border"
        style={{ background: (n.actor_color ?? '#222') + '24', color: n.actor_color ?? '#999' }}
      >
        {n.actor_initials}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Icon className="size-3" style={{ color: meta.color }} aria-hidden />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: meta.color }}>
            {meta.label}
          </span>
          {n.task_key && (
            <Badge variant="default" className="font-mono text-[9px]">
              {n.task_key}
            </Badge>
          )}
          {!n.read && (
            <span className="ml-auto size-1.5 rounded-full bg-gold" aria-label="unread" />
          )}
        </div>
        <div className="text-[13px] font-medium text-foreground leading-snug">{n.title}</div>
        <div className="text-[12px] text-muted-foreground line-clamp-2">{n.body}</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          {formatDistanceStrict(new Date(n.created_at), DEMO_NOW, { addSuffix: true })}
        </div>
      </div>
    </div>
  );

  if (n.href) {
    return (
      <li>
        <Link
          href={n.href}
          onClick={() => {
            onClick(n.id);
            onClose();
          }}
          className="block"
        >
          {Inner}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <button onClick={() => onClick(n.id)} className="block w-full text-left">
        {Inner}
      </button>
    </li>
  );
}
