import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function EmptyOrgPrompt() {
  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 md:px-8 py-16 space-y-5">
      <div className="space-y-2 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Workspace empty</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Set up your workspace first.</h1>
        <p className="text-muted-foreground">
          You’re signed in but don’t belong to an organisation yet. Run the seeder from the dashboard.
        </p>
      </div>
      <Card>
        <CardContent className="p-6 flex items-center gap-3">
          <div className="size-9 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold">Seed the demo workspace</div>
            <p className="text-[12px] text-muted-foreground">Creates an org, 2 projects, sprints, and tasks.</p>
          </div>
          <Button asChild>
            <Link href="/dashboard">
              Go set up
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
