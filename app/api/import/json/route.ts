import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { importPayloadSchema } from '@/lib/import/schema';

const requestSchema = z.object({
  project_id: z.string().uuid().or(z.string().min(1)),
  sprint_id: z.string().nullable().optional(),
  file_name: z.string().max(200).optional(),
  payload: importPayloadSchema,
});

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: 'Auth not configured. Add Supabase keys to .env.local then restart the server.' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { project_id, sprint_id, file_name, payload } = parsed.data;

  // Look up project org_id (denormalised into tasks)
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id, org_id')
    .eq('id', project_id)
    .single();
  if (projErr || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Resolve assignee names against THIS org's members only. A bare name match
  // across profiles could land a task on a same-named user in another org.
  const assigneeNames = Array.from(new Set(payload.tasks.map((t) => t.assignee).filter(Boolean) as string[]));
  const nameToId: Record<string, string> = {};
  if (assigneeNames.length > 0) {
    const { data: memberRows } = await supabase
      .from('org_members')
      .select('user_id, profiles(id, full_name)')
      .eq('org_id', project.org_id)
      .is('deleted_at', null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (memberRows ?? []) as any[]) {
      const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      if (p?.full_name) nameToId[p.full_name] = p.id ?? row.user_id;
    }
  }

  const rows = payload.tasks.map((t) => ({
    org_id: project.org_id,
    project_id: project.id,
    sprint_id: sprint_id || null,
    title: t.title,
    description: t.description ?? '',
    type: t.type,
    priority: t.priority,
    story_points: t.story_points ?? null,
    assignee_id: t.assignee ? nameToId[t.assignee] ?? null : null,
    reporter_id: user.id,
    due_date: t.due_date ?? null,
    task_key: '', // trigger will fill
  }));

  // Log the import attempt
  const { data: importRow } = await supabase
    .from('csv_imports')
    .insert({
      org_id: project.org_id,
      user_id: user.id,
      project_id: project.id,
      sprint_id: sprint_id || null,
      file_name: file_name ?? 'paste.json',
      row_count: rows.length,
      status: 'parsing',
      raw_json: payload,
    })
    .select('id')
    .maybeSingle();

  const { data: inserted, error: insertErr } = await supabase.from('tasks').insert(rows).select('id');
  if (insertErr) {
    if (importRow?.id) {
      await supabase
        .from('csv_imports')
        .update({ status: 'failed', errors: [insertErr.message], completed_at: new Date().toISOString() })
        .eq('id', importRow.id);
    }
    return NextResponse.json({ error: insertErr.message, created: 0 }, { status: 400 });
  }

  if (importRow?.id) {
    await supabase
      .from('csv_imports')
      .update({
        status: 'imported',
        rows_imported: inserted?.length ?? 0,
        completed_at: new Date().toISOString(),
      })
      .eq('id', importRow.id);
  }

  return NextResponse.json({
    created: inserted?.length ?? 0,
    ids: (inserted ?? []).map((r: { id: string }) => r.id),
    errors: [],
  });
}
