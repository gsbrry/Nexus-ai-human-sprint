import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';

const schema = z.object({
  status: z.enum(['todo', 'in_progress', 'in_review', 'blocked', 'done']),
  blocker_reason: z.string().max(500).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

  const parsed = schema.safeParse(body);
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

  const { status, blocker_reason } = parsed.data;

  const update: Record<string, unknown> = { status };
  if (status === 'blocked') {
    update.is_blocked = true;
    if (blocker_reason) update.blocker_reason = blocker_reason;
  } else {
    update.is_blocked = false;
    update.blocker_reason = null;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(update)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ task: data });
}
