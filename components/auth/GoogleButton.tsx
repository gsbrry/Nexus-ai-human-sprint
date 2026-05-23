'use client';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function GoogleButton() {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const res = await fetch('/api/auth/google', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (json.url) {
        window.location.href = json.url;
      }
    });
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1S8.7 5.9 12 5.9c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
          />
        </svg>
      )}
      Continue with Google
    </Button>
  );
}
