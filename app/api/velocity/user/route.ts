import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';

const querySchema = z.object({
  project_id: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(6),
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

  // Aggregate per-user velocity across the last <limit> completed sprints.
  let q = supabase
    .from('velocity_snapshots')
    .select('user_id, sprint_id, points_committed, points_completed, snapshot_date')
    .order('snapshot_date', { ascending: false })
    .limit(limit * 20);
  if (project_id) q = q.eq('project_id', project_id);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ snapshots: data ?? [] });
}
