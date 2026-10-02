import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, isResponse, jsonError } from '@/lib/server/api';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  /** Omit `id` to mark the whole feed read. */
  id: z.string().uuid().optional(),
  all: z.boolean().optional(),
});

/** Maps the DB notification_type onto the four filter buckets the bell shows. */
function kindFor(type: string): 'mention' | 'ai' | 'system' | 'assigned' | 'blocker' | 'sprint' {
  if (type === 'mention' || type === 'task_commented') return 'mention';
  if (type === 'ai_agent_update') return 'ai';
  if (type === 'task_assigned') return 'assigned';
  if (type === 'task_blocked') return 'blocker';
  if (type.startsWith('sprint_')) return 'sprint';
  return 'system';
}

/** GET /api/notifications — the caller's own feed, newest first. */
export async function GET(request: Request) {
  const ctx = await requireUser();
  if (isResponse(ctx)) return ctx;

  const limit = Math.min(Number(new URL(request.url).searchParams.get('limit') ?? 50), 100);

  const { data, error } = await ctx.supabase
    .from('notifications')
    .select('id, type, title, body, link, task_id, sprint_id, read_at, created_at')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return jsonError(error.message, 400);

  type FeedItem = {
    id: string;
    kind: ReturnType<typeof kindFor>;
    type: string;
    title: string;
    body: string;
    href?: string;
    created_at: string;
    read: boolean;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notifications: FeedItem[] = (data ?? []).map((n: any) => ({
    id: n.id,
    kind: kindFor(n.type),
    type: n.type,
    title: n.title,
    body: n.body ?? '',
    href: n.link ?? undefined,
    created_at: n.created_at,
    read: Boolean(n.read_at),
  }));

  return NextResponse.json({
    notifications,
    unread: notifications.filter((n) => !n.read).length,
  });
}

/** PATCH /api/notifications — mark one, or all, as read. */
export async function PATCH(request: Request) {
  const ctx = await requireUser();
  if (isResponse(ctx)) return ctx;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
  if (!parsed.data.id && !parsed.data.all) return jsonError('Pass an id, or all: true', 400);

  let query = ctx.supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', ctx.userId)
    .is('read_at', null);

  if (parsed.data.id) query = query.eq('id', parsed.data.id);

  const { error } = await query;
  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ ok: true });
}
