export default function VelocityPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">V-01 · Velocity</div>
      <h1 className="text-3xl font-extrabold tracking-tight">Velocity</h1>
      <p className="text-muted-foreground max-w-[560px]">
        Per-member velocity cards, sprint burndowns, and recharts visualisations arrive in Sprint 3.
      </p>
      <div className="rounded-md border border-dashed border-border bg-[#0A0A0A] px-5 py-8 text-center text-sm text-muted-foreground">
        Coming up next: V-01 velocity dashboard with Recharts.
      </div>
    </div>
  );
}
