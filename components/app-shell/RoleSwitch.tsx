'use client';
import { usePreviewRole } from '@/components/app-shell/PreviewRoleProvider';
import { cn } from '@/lib/utils';

const OPTIONS: { value: 'member' | 'scrum_master' | 'org_admin'; label: string }[] = [
  { value: 'member', label: 'Member' },
  { value: 'scrum_master', label: 'SM' },
  { value: 'org_admin', label: 'Admin' },
];

export function RoleSwitch() {
  const { role, setRole } = usePreviewRole();
  return (
    <div className="hidden sm:flex items-center gap-2">
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">View as</span>
      <div className="inline-flex items-center gap-0.5 rounded-md bg-[#0A0A0A] p-0.5 border border-border">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setRole(o.value)}
            className={cn(
              'px-2.5 py-1 rounded-sm font-mono text-[10px] uppercase tracking-[0.1em] transition-colors',
              role === o.value
                ? 'bg-card text-gold border border-gold/30'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
