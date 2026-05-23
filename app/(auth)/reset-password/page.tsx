import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">A-04 · New password</div>
        <h1 className="text-3xl font-extrabold tracking-tight">Set a new password.</h1>
        <p className="text-sm text-muted-foreground">Minimum 8 characters.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-7">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
