export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground p-8">
      <div className="max-w-2xl w-full">
        <p className="font-mono text-xs tracking-widest text-gold mb-4">
          NEXUS · SPRINT 1 · FOUNDATION
        </p>
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-6">
          AI-era project management.
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed mb-8">
          Scaffold ready. Database migrations written. Auth client wired. Awaiting Supabase credentials in <code className="font-mono text-gold">.env.local</code> to run migrations and begin Sprint 2.
        </p>
        <div className="flex gap-3 font-mono text-xs text-muted-foreground">
          <span className="px-2 py-1 rounded border border-border">Next.js 14</span>
          <span className="px-2 py-1 rounded border border-border">TypeScript</span>
          <span className="px-2 py-1 rounded border border-border">Supabase</span>
          <span className="px-2 py-1 rounded border border-border">YALLO theme</span>
        </div>
      </div>
    </main>
  );
}
