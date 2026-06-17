'use client';
import { useState } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CopySqlButton({ sql, label = 'Copy SQL' }: { sql: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore — clipboard not available
    }
  }

  return (
    <Button variant="outline" onClick={onCopy} disabled={!sql || sql.length < 50}>
      {copied ? <CheckCircle2 className="size-4 text-primary" /> : <Copy className="size-4" />}
      {copied ? 'Copied!' : label}
    </Button>
  );
}
