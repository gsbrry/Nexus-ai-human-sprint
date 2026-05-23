export default function SprintsPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">T-01 · Sprints</div>
      <h1 className="text-3xl font-extrabold tracking-tight">Sprints</h1>
      <p className="text-muted-foreground max-w-[560px]">
        Sprint plan view, Kanban board, and bulk task moves arrive in Sprint 3 of the NEXUS build.
      </p>
      <div className="rounded-md border border-dashed border-border bg-[#0A0A0A] px-5 py-8 text-center text-sm text-muted-foreground">
        Coming up next: T-01 sprint plan and T-02 Kanban board.
      </div>
    </div>
  );
}
