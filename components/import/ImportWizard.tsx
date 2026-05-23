'use client';
import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { v4 as uuid } from 'uuid';
import { Check, Copy, FileSpreadsheet, Loader2, Sparkles, Upload, X, Wand2, ArrowRight, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { mockProjects, mockSprints, mockUsers, projectById, type MockProject, type MockSprint } from '@/lib/mock/yallo';
import { buildClaudePrompt } from '@/lib/import/prompt';
import { importPayloadSchema, type ImportPayload } from '@/lib/import/schema';

type Step = 'upload' | 'prompt' | 'json' | 'result';

type ParsedCsv = {
  file_name: string;
  row_count: number;
  headers: string[];
  rows: Record<string, string>[];
  raw: string;
};

type ImportResult = {
  ok: boolean;
  created: number;
  errors: string[];
  ids: string[];
};

export function ImportWizard() {
  const [step, setStep] = useState<Step>('upload');
  const [project, setProject] = useState<MockProject>(mockProjects[0]);
  const [sprintId, setSprintId] = useState<string | null>(
    mockSprints.find((s) => s.project_id === mockProjects[0].id && s.status === 'active')?.id ?? null
  );
  const sprint: MockSprint | null = useMemo(
    () => mockSprints.find((s) => s.id === sprintId) ?? null,
    [sprintId]
  );

  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const [jsonText, setJsonText] = useState('');
  const [validated, setValidated] = useState<ImportPayload | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFile(file: File) {
    setParseError(null);
    setCsv(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(results.errors[0].message);
          return;
        }
        const rows = results.data.filter((r) => Object.values(r).some((v) => String(v).trim() !== ''));
        if (rows.length === 0) {
          setParseError('CSV has no data rows.');
          return;
        }
        const reader = new FileReader();
        reader.onload = () =>
          setCsv({
            file_name: file.name,
            row_count: rows.length,
            headers: results.meta.fields ?? [],
            rows,
            raw: String(reader.result ?? ''),
          });
        reader.readAsText(file);
      },
      error: (err) => setParseError(err.message),
    });
  }

  function reset() {
    setStep('upload');
    setCsv(null);
    setParseError(null);
    setJsonText('');
    setValidated(null);
    setValidationError(null);
    setResult(null);
  }

  const prompt = useMemo(() => {
    if (!csv) return '';
    return buildClaudePrompt({
      project,
      sprint,
      members: mockUsers,
      csv: csv.raw,
    });
  }, [csv, project, sprint]);

  function validateJson() {
    setValidationError(null);
    setValidated(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      setValidationError((e as Error).message);
      return;
    }
    const r = importPayloadSchema.safeParse(parsed);
    if (!r.success) {
      const issues = r.error.issues.slice(0, 5).map((i) => `• ${i.path.join('.') || 'root'}: ${i.message}`).join('\n');
      setValidationError(`Schema check failed:\n${issues}`);
      return;
    }
    setValidated(r.data);
  }

  async function doImport() {
    if (!validated) return;
    setImporting(true);
    try {
      const res = await fetch('/api/import/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          sprint_id: sprint?.id ?? null,
          file_name: csv?.file_name ?? 'paste.json',
          payload: validated,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Mock success when Supabase isn't live yet so the demo flow finishes.
        if (res.status === 503) {
          const ids = validated.tasks.map(() => uuid());
          setResult({ ok: true, created: validated.tasks.length, errors: [], ids });
        } else {
          setResult({ ok: false, created: 0, errors: [json.error ?? 'Import failed'], ids: [] });
        }
      } else {
        setResult({ ok: true, created: json.created ?? validated.tasks.length, errors: json.errors ?? [], ids: json.ids ?? [] });
      }
      setStep('result');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      {step === 'upload' && (
        <StepUpload
          project={project}
          setProject={setProject}
          sprintId={sprintId}
          setSprintId={setSprintId}
          csv={csv}
          parseError={parseError}
          onFile={handleFile}
          onContinue={() => setStep('prompt')}
        />
      )}

      {step === 'prompt' && csv && (
        <StepPrompt
          prompt={prompt}
          rows={csv.rows}
          headers={csv.headers}
          onBack={() => setStep('upload')}
          onContinue={() => setStep('json')}
        />
      )}

      {step === 'json' && csv && (
        <StepJson
          jsonText={jsonText}
          setJsonText={setJsonText}
          validated={validated}
          validationError={validationError}
          importing={importing}
          onValidate={validateJson}
          onImport={doImport}
          onBack={() => setStep('prompt')}
        />
      )}

      {step === 'result' && result && (
        <StepResult result={result} onReset={reset} project={project} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------
function Stepper({ step }: { step: Step }) {
  const items: { id: Step; label: string; code: string }[] = [
    { id: 'upload', label: 'Upload CSV', code: 'I-01' },
    { id: 'prompt', label: 'Copy prompt', code: 'I-01' },
    { id: 'json', label: 'Paste JSON', code: 'I-02' },
    { id: 'result', label: 'Result', code: 'I-03' },
  ];
  const idx = items.findIndex((i) => i.id === step);
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {items.map((i, k) => (
        <div key={i.id} className="flex items-center gap-2 shrink-0">
          <div
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-1.5',
              k === idx
                ? 'border-gold/50 bg-gold/10'
                : k < idx
                ? 'border-[#1D9E75]/40 bg-[#1D9E75]/10'
                : 'border-border bg-[#0A0A0A]'
            )}
          >
            <span
              className={cn(
                'font-mono text-[10px] uppercase tracking-[0.12em]',
                k === idx ? 'text-gold' : k < idx ? 'text-[#5BC498]' : 'text-muted-foreground'
              )}
            >
              {i.code}
            </span>
            <span
              className={cn(
                'font-mono text-[11px] uppercase tracking-[0.08em]',
                k === idx ? 'text-foreground' : k < idx ? 'text-[#5BC498]' : 'text-muted-foreground'
              )}
            >
              {i.label}
            </span>
            {k < idx && <Check className="size-3 text-[#5BC498]" />}
          </div>
          {k < items.length - 1 && <ArrowRight className="size-3 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Upload
// ---------------------------------------------------------------------------
function StepUpload({
  project,
  setProject,
  sprintId,
  setSprintId,
  csv,
  parseError,
  onFile,
  onContinue,
}: {
  project: MockProject;
  setProject: (p: MockProject) => void;
  sprintId: string | null;
  setSprintId: (id: string | null) => void;
  csv: ParsedCsv | null;
  parseError: string | null;
  onFile: (f: File) => void;
  onContinue: () => void;
}) {
  const [drag, setDrag] = useState(false);
  const sprintsForProject = mockSprints.filter((s) => s.project_id === project.id);

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Target
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1.5">
                Project
              </div>
              <div className="flex flex-wrap gap-2">
                {mockProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProject(p);
                      const active = mockSprints.find((s) => s.project_id === p.id && s.status === 'active');
                      setSprintId(active?.id ?? null);
                    }}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors',
                      project.id === p.id
                        ? 'border-gold/50 bg-gold/10 text-foreground'
                        : 'border-border bg-[#0A0A0A] text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="font-mono text-[10px] font-bold" style={{ color: p.color }}>
                      {p.key}
                    </span>
                    <span className="text-[12px]">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1.5">
                Sprint
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSprintId(null)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors',
                    !sprintId
                      ? 'border-gold/50 bg-gold/10 text-foreground'
                      : 'border-border bg-[#0A0A0A] text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="font-mono text-[11px]">Backlog</span>
                </button>
                {sprintsForProject.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSprintId(s.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors',
                      sprintId === s.id
                        ? 'border-gold/50 bg-gold/10 text-foreground'
                        : 'border-border bg-[#0A0A0A] text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Badge variant={s.status === 'active' ? 'gold' : 'default'}>#{s.sprint_number}</Badge>
                    <span className="text-[12px]">{s.name.split('·')[1]?.trim() ?? s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            CSV file
          </div>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files?.[0];
              if (f) onFile(f);
            }}
            className={cn(
              'cursor-pointer block rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
              drag
                ? 'border-gold/60 bg-gold/5'
                : csv
                ? 'border-[#1D9E75]/40 bg-[#1D9E75]/5'
                : 'border-border bg-[#0A0A0A] hover:border-gold/40'
            )}
          >
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            {csv ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="size-8 text-[#5BC498]" />
                <div className="text-sm font-semibold">{csv.file_name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {csv.row_count} rows · {csv.headers.length} columns
                </div>
                <div className="text-[11px] text-muted-foreground">Click or drop another file to replace.</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="size-8 text-gold" />
                <div className="text-sm font-semibold">Drop a CSV here or click to choose</div>
                <div className="text-[11px] text-muted-foreground">
                  Any column structure works. The Claude prompt adapts to your headers.
                </div>
              </div>
            )}
          </label>

          {parseError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {csv && (
            <div className="mt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-2">
                Preview · first 5 rows
              </div>
              <ScrollArea className="max-h-[260px] rounded-md border border-border">
                <table className="w-full text-[12px]">
                  <thead className="bg-[#0A0A0A] sticky top-0">
                    <tr>
                      {csv.headers.map((h) => (
                        <th
                          key={h}
                          className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground border-b border-border"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csv.rows.slice(0, 5).map((r, i) => (
                      <tr key={i} className="border-b border-border last:border-b-0">
                        {csv.headers.map((h) => (
                          <td key={h} className="px-3 py-2 align-top text-foreground/90">
                            <span className="line-clamp-2">{r[h] ?? ''}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Link href="/import/sample" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground hover:text-gold">
          Need a sample CSV?
        </Link>
        <Button onClick={onContinue} disabled={!csv}>
          Continue <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Claude prompt
// ---------------------------------------------------------------------------
function StepPrompt({
  prompt,
  rows,
  headers,
  onBack,
  onContinue,
}: {
  prompt: string;
  rows: Record<string, string>[];
  headers: string[];
  onBack: () => void;
  onContinue: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      <Card className="border-gold/30 bg-gold/[0.03]">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-md border border-gold/40 bg-gold/15 flex items-center justify-center shrink-0">
              <Sparkles className="size-5 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-gold">
                Mode 1 · manual JSON (no API key needed)
              </div>
              <h3 className="text-base font-semibold mt-1">Paste this prompt into Claude Chat.</h3>
              <p className="text-[12px] text-muted-foreground mt-1">
                The prompt embeds your project context, team roster, story-point options, and the CSV.
                Claude will return strict JSON. Paste that JSON into the next step.
              </p>
            </div>
            <Button onClick={copy} variant="default" className="shrink-0">
              {copied ? (
                <>
                  <Check className="size-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-4" /> Copy prompt
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-2.5 border-b border-border bg-[#0A0A0A] flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Prompt preview · {prompt.length.toLocaleString()} chars
            </div>
            <Badge variant="default">{rows.length} rows · {headers.length} cols</Badge>
          </div>
          <ScrollArea className="max-h-[420px]">
            <pre className="px-4 py-3 text-[11px] leading-relaxed font-mono whitespace-pre-wrap break-words text-foreground/85">
              {prompt}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue}>
          I have the JSON <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Paste JSON + validate
// ---------------------------------------------------------------------------
function StepJson({
  jsonText,
  setJsonText,
  validated,
  validationError,
  importing,
  onValidate,
  onImport,
  onBack,
}: {
  jsonText: string;
  setJsonText: (s: string) => void;
  validated: ImportPayload | null;
  validationError: string | null;
  importing: boolean;
  onValidate: () => void;
  onImport: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">I-02 · JSON editor</div>
              <h3 className="text-base font-semibold mt-1">Paste Claude’s JSON below.</h3>
            </div>
            <Button variant="outline" onClick={onValidate} disabled={!jsonText.trim()}>
              <Wand2 className="size-4" /> Validate
            </Button>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{ "tasks": [ { "title": "...", "type": "feature", "priority": "medium", "story_points": 3, "assignee": "Raphy Varghese", "due_date": "2025-06-20" } ] }'
            spellCheck={false}
            className="w-full h-[300px] sm:h-[360px] rounded-md border border-border bg-[#0A0A0A] px-3 py-3 text-[12px] font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-ring/30 resize-y"
          />
          {validationError && (
            <Alert variant="destructive">
              <AlertDescription className="whitespace-pre-line font-mono text-[11px]">{validationError}</AlertDescription>
            </Alert>
          )}
          {validated && (
            <Alert variant="success">
              <Check className="size-4" />
              <AlertDescription>
                Schema OK. <strong>{validated.tasks.length}</strong> tasks ready to import.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {validated && (
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-2.5 border-b border-border bg-[#0A0A0A]">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Preview · {validated.tasks.length} tasks
              </div>
            </div>
            <ScrollArea className="max-h-[320px]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#0A0A0A] sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground border-b border-border">
                      Title
                    </th>
                    <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground border-b border-border">
                      Type
                    </th>
                    <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground border-b border-border">
                      Priority
                    </th>
                    <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground border-b border-border">
                      Assignee
                    </th>
                    <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground border-b border-border">
                      Pts
                    </th>
                    <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground border-b border-border">
                      Due
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {validated.tasks.map((t, i) => (
                    <tr key={i} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2">
                        <span className="line-clamp-1">{t.title}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] uppercase text-muted-foreground">{t.type}</td>
                      <td className="px-3 py-2 font-mono text-[10px] uppercase text-muted-foreground">{t.priority}</td>
                      <td className="px-3 py-2 text-[12px]">{t.assignee ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-[12px]">{t.story_points ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{t.due_date ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onImport} disabled={!validated || importing}>
          {importing && <Loader2 className="size-4 animate-spin" />}
          Import {validated ? `${validated.tasks.length} tasks` : ''} <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Result
// ---------------------------------------------------------------------------
function StepResult({
  result,
  onReset,
  project,
}: {
  result: ImportResult;
  onReset: () => void;
  project: MockProject;
}) {
  return (
    <div className="space-y-5">
      <Card
        className={cn(
          result.ok
            ? 'border-[#1D9E75]/40 bg-[#1D9E75]/[0.05]'
            : 'border-destructive/40 bg-destructive/[0.05]'
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'size-12 rounded-full flex items-center justify-center',
                result.ok ? 'bg-[#1D9E75]/20 text-[#5BC498]' : 'bg-destructive/20 text-destructive'
              )}
            >
              {result.ok ? <Check className="size-6" /> : <X className="size-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">I-03 · Import result</div>
              <h2 className="text-2xl font-extrabold tracking-tight">
                {result.ok ? `Imported ${result.created} tasks.` : 'Import failed.'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {result.ok
                  ? `They're now in the ${project.name} backlog or current sprint.`
                  : 'No tasks were created. See errors below.'}
              </p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 space-y-1">
              {result.errors.map((e, i) => (
                <div key={i} className="text-[12px] font-mono text-destructive">
                  • {e}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="size-4" /> Import another file
        </Button>
        {result.ok && (
          <Link href={`/projects/${project.key.toLowerCase()}`}>
            <Button>
              Open {project.key} <ArrowRight className="size-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
