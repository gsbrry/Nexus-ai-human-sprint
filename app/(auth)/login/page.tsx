import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">A-01 · Login</div>
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome back.</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue your sprint.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-7 space-y-5">
        <LoginForm />
        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-3 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            or
          </span>
        </div>
        <GoogleButton />
      </div>

      <div className="text-center text-sm text-muted-foreground">
        New to NEXUS?{' '}
        <Link href="/register" className="text-gold hover:text-gold-light underline-offset-4 hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}
