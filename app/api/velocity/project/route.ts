import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';

const querySchema = z.object({
  project_id: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: 'Auth not configured. Add Supabase keys to .env.local then restart the server.' },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }
  const { project_id, limit } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  // Aggregate velocity from velocity_snapshots, joined to sprints.
  // RLS will filter to the caller's orgs automatically.
  let q = supabase
    .from('sprints')
    .select(
      'id, sprint_number, name, start_date, end_date, status, project_id, ' +
        'velocity_snapshots(points_committed, points_completed, tasks_committed, tasks_completed)'
    )
    .eq('status', 'completed')
    .order('end_date', { ascending: false })
    .limit(limit);
  if (project_id) q = q.eq('project_id', project_id);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ sprints: data ?? [] });
}
