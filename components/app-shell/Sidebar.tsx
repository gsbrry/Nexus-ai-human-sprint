'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Repeat,
  ListChecks,
  TrendingUp,
  Settings,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', code: '01', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', code: '02', icon: FolderKanban },
  { href: '/sprints', label: 'Sprints', code: '03', icon: Repeat },
  { href: '/tasks', label: 'My tasks', code: '04', icon: ListChecks },
  { href: '/velocity', label: 'Velocity', code: '05', icon: TrendingUp },
  { href: '/settings', label: 'Settings', code: '06', icon: Settings },
  { href: '/admin', label: 'Admin', code: '07', icon: Shield, role: 'super_admin' as const },
];

export function Sidebar({ role }: { role?: 'member' | 'scrum_master' | 'org_admin' | 'super_admin' }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-[232px] shrink-0 flex-col border-r border-border bg-[#0A0A0A]">
      <div className="px-5 py-5 border-b border-border">
        <Logo />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.filter((item) => !item.role || item.role === role).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-gold/10 text-gold border-l-2 border-gold pl-[10px]'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              )}
            >
              <span
                className={cn(
                  'font-mono text-[9px] tracking-[0.12em]',
                  active ? 'text-gold' : 'text-[#555]'
                )}
              >
                {item.code}
              </span>
              <Icon className="size-4" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-border">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#555]">Sprint 2</div>
        <div className="text-xs text-muted-foreground mt-1">Auth + core screens</div>
      </div>
    </aside>
  );
}
