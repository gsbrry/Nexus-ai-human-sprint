export default function SettingsPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">N-02 · Settings</div>
      <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
      <p className="text-muted-foreground max-w-[560px]">
        User and org settings (including AI key management) arrive in Sprint 4.
      </p>
      <div className="rounded-md border border-dashed border-border bg-[#0A0A0A] px-5 py-8 text-center text-sm text-muted-foreground">
        Coming up: profile, password change, Anthropic key, Telegram link, org settings.
      </div>
    </div>
  );
}
