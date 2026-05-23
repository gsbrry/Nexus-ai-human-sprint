import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">A-04 · Reset</div>
        <h1 className="text-3xl font-extrabold tracking-tight">Reset your password.</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll email you a secure link. It expires in exactly one hour.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-7">
        <ForgotPasswordForm />
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link href="/login" className="text-gold hover:text-gold-light underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
