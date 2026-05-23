import { ImportWizard } from '@/components/import/ImportWizard';

export default function ImportPage() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">I-01 · Import</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Import tasks</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Upload a CSV → copy the Claude prompt → paste the JSON Claude returns → review → import.
          No API key required.
        </p>
      </div>
      <ImportWizard />
    </div>
  );
}
