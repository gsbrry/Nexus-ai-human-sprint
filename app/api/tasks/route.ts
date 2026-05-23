import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { taskCreateSchema } from '@/lib/validations/task';

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

  const parsed = taskCreateSchema.safeParse(body);
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

  // Look up project to get org_id (denormalised into tasks per @David)
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id, org_id')
    .eq('id', parsed.data.project_id)
    .single();
  if (projErr || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      org_id: project.org_id,
      project_id: project.id,
      sprint_id: parsed.data.sprint_id ?? null,
      title: parsed.data.title,
      description: parsed.data.description ?? '',
      type: parsed.data.type ?? 'feature',
      priority: parsed.data.priority ?? 'medium',
      status: parsed.data.status ?? 'todo',
      story_points: parsed.data.story_points ?? null,
      assignee_id: parsed.data.assignee_id ?? null,
      reporter_id: user.id,
      due_date: parsed.data.due_date ?? null,
      task_key: '', // trigger fills
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ task: data });
}
