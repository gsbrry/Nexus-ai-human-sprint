import { ProfileSetupForm } from '@/components/auth/ProfileSetupForm';

export default function ProfileSetupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">A-03 · Profile setup</div>
        <h1 className="text-3xl font-extrabold tracking-tight">One last step.</h1>
        <p className="text-sm text-muted-foreground">
          Confirm your name and create or join an organisation.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-7">
        <ProfileSetupForm />
      </div>
    </div>
  );
}
