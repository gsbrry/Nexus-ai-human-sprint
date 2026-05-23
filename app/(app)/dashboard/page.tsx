import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isAuthConfigured } from '@/lib/auth-config';

export default function DashboardPage() {
  return (
    <div className="max-w-[1160px] mx-auto px-8 py-10 space-y-8">
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">D-01 · Dashboard</div>
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome to your sprint.</h1>
        <p className="text-muted-foreground">
          This is the post-login landing. Phase 2B will populate it with YALLO AI Academy mock tasks.
        </p>
      </div>

      {!isAuthConfigured() && (
        <div className="rounded-lg border border-gold/30 bg-gold/5 px-5 py-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-1">Preview mode</div>
          <p className="text-sm text-muted-foreground">
            Supabase env vars not detected. Auth routes return 503; this layout renders so you can review the
            shell. Set <code className="font-mono text-gold">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="font-mono text-gold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
            <code className="font-mono text-gold">.env.local</code>, then restart with{' '}
            <code className="font-mono text-gold">sudo supervisorctl restart nextjs</code>.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: 'Active sprint', value: '—' },
          { label: 'Open tasks', value: '—' },
          { label: 'Blocked', value: '—' },
          { label: 'Velocity (avg)', value: '—' },
        ].map((s) => (
          <Card key={s.label} className="bg-[#0A0A0A]">
            <CardContent className="p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {s.label}
              </div>
              <div className="font-mono text-[26px] font-extrabold mt-1">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Up next</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Phase 2B will render the YALLO AI Academy task list here, including blocker badges, owner avatars,
          and the T-03 slide-in task detail panel.
        </CardContent>
      </Card>
    </div>
  );
}
