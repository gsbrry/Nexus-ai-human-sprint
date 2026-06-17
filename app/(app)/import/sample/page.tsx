import Link from 'next/link';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ImportSamplePage() {
  return (
    <div className="max-w-[700px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-5">
      <Link
        href="/import"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-gold"
      >
        ← Back to import
      </Link>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-md border border-gold/40 bg-gold/15 flex items-center justify-center">
              <FileSpreadsheet className="size-5 text-gold" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Sample CSV</div>
              <h1 className="text-xl font-bold tracking-tight">nexus-sample-tasks.csv</h1>
              <p className="text-[12px] text-muted-foreground">
                8 example rows shaped like a typical GBM sprint plan.
              </p>
            </div>
          </div>
          <p className="text-[13px] text-muted-foreground">
            The import wizard doesn’t care which columns you use — the Claude prompt adapts to whatever
            headers your CSV contains. This sample uses the canonical shape:
            <code className="font-mono text-gold text-[11px] ml-1">
              title,description,type,priority,story_points,assignee,due_date
            </code>
            .
          </p>
          <a href="/api/import/sample">
            <Button>
              <Download className="size-4" /> Download sample
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
