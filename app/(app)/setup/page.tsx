import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Copy,
  Database,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CopySqlButton } from '@/components/setup/CopySqlButton';
import { SeedDemoButton } from '@/components/setup/SeedDemoButton';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { readFile } from 'fs/promises';
import path from 'path';

type Step = 'env' | 'auth' | 'migrations' | 'seed' | 'done';

async function detectStep(): Promise<{ step: Step; message?: string; userEmail?: string }> {
  if (!isAuthConfigured()) return { step: 'env' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { step: 'auth' };

  // Probe a table to detect schema presence
  const { error: schemaErr } = await supabase
    .from('org_members')
    .select('org_id', { head: true, count: 'exact' });
  if (schemaErr) return { step: 'migrations', message: schemaErr.message, userEmail: user.email };

  // Check membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership?.org_id) return { step: 'seed', userEmail: user.email };
  return { step: 'done', userEmail: user.email };
}

async function readBundleSql(): Promise<string> {
  try {
    return await readFile(path.join(process.cwd(), 'supabase/_bundle_schema.sql'), 'utf-8');
  } catch {
    return '-- bundle file missing — regenerate with /app/supabase/migrations/*.sql';
  }
}

export default async function SetupPage() {
  const { step, message, userEmail } = await detectStep();
  if (step === 'done') redirect('/dashboard');
  const bundleSql = step === 'migrations' ? await readBundleSql() : '';
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\/|\.supabase\.co.*$/g, '') ?? '';
  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : 'https://supabase.com/dashboard';

  const steps: { key: Step; label: string }[] = [
    { key: 'env', label: 'Connect Supabase' },
    { key: 'auth', label: 'Sign in' },
    { key: 'migrations', label: 'Run migrations' },
    { key: 'seed', label: 'Seed demo data' },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-14 space-y-6">
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Setup wizard
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Get NEXUS live in 4 steps.
        </h1>
        <p className="text-muted-foreground">
          The app already works in demo mode — this wizard moves you onto a real Supabase database.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 flex-wrap">
        {steps.map((s, i) => {
          const done = i < currentIdx;
          const current = i === currentIdx;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={
                  'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 ' +
                  (current
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : done
                    ? 'border-border bg-card text-foreground'
                    : 'border-border bg-card text-muted-foreground')
                }
              >
                {done ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />}
                <span className="font-mono text-[10px] uppercase tracking-[0.12em]">{s.label}</span>
              </div>
              {i < steps.length - 1 && <ArrowRight className="size-3 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {step === 'env' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <SectionHeader code="01" title="Connect Supabase" />
            <p className="text-[13px] text-muted-foreground">
              No Supabase env vars detected. Drop your project URL + anon key + service-role key
              into <code className="bg-card border border-border rounded px-1.5 py-0.5 font-mono text-[11px]">app/.env.local</code>,
              then restart with <code className="bg-card border border-border rounded px-1.5 py-0.5 font-mono text-[11px]">sudo supervisorctl restart nextjs</code>.
            </p>
            <Alert>
              <Database className="size-4" />
              <AlertTitle>Need step-by-step?</AlertTitle>
              <AlertDescription>
                Open <code className="font-mono text-[11px]">/app/SETUP_SUPABASE.md</code> for the full walkthrough.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {step === 'auth' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <SectionHeader code="02" title="Sign in to Supabase" />
            <p className="text-[13px] text-muted-foreground">
              Supabase is connected but you&apos;re not signed in (or you&apos;re in demo mode). Create
              a real account so the seeder can attach a workspace to your user id.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/register">
                  Create real account
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'migrations' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <SectionHeader code="03" title="Run database migrations" />
            <p className="text-[13px] text-muted-foreground">
              Schema not detected. Open Supabase SQL editor, paste the bundle, click Run. ~2 sec.
            </p>
            <Alert variant="destructive">
              <Database className="size-4" />
              <AlertTitle>Supabase response</AlertTitle>
              <AlertDescription className="font-mono text-[11px]">{message}</AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={sqlEditorUrl} target="_blank" rel="noreferrer">
                  Open Supabase SQL editor
                  <ExternalLink className="size-4" />
                </a>
              </Button>
              <CopySqlButton sql={bundleSql} label="Copy schema SQL" />
            </div>
            <details className="rounded-md border border-border bg-[#0A0A0A] p-3">
              <summary className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground cursor-pointer">
                Preview bundle ({(bundleSql.length / 1024).toFixed(1)} KB · ~1000 lines)
              </summary>
              <pre className="mt-3 max-h-[260px] overflow-auto font-mono text-[10px] text-muted-foreground whitespace-pre-wrap break-words">
                {bundleSql.slice(0, 1600)}
                {bundleSql.length > 1600 && '\n…\n[truncated — use Copy button for full file]'}
              </pre>
            </details>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              Once you run it, refresh this page. The wizard will jump to step 4.
            </p>
          </CardContent>
        </Card>
      )}

      {step === 'seed' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <SectionHeader code="04" title="Seed the demo workspace" />
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div>
                <div className="text-[14px] font-bold">Drops realistic data for {userEmail}</div>
                <ul className="text-[12px] text-muted-foreground mt-1.5 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-primary" />1 org (NEXUS Studio) · you become super_admin
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-primary" />2 projects (GBM + NEX) + 2 active sprints
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-primary" />14 tasks across statuses & priorities
                  </li>
                </ul>
              </div>
            </div>
            <SeedDemoButton />
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground text-center">
              Idempotent · safe to click more than once
            </p>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <Badge variant="default" className="font-mono">
          {step === 'env' ? '0/4' : step === 'auth' ? '1/4' : step === 'migrations' ? '2/4' : '3/4'}{' '}
          complete
        </Badge>
      </div>
    </div>
  );
}

function SectionHeader({ code, title }: { code: string; title: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
        Step {code}
      </div>
      <div className="text-lg font-bold">{title}</div>
    </div>
  );
}
