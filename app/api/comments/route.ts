import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrg, isResponse, jsonError } from '@/lib/server/api';
import type { BoardComment } from '@/lib/board';
import { emitNotification } from '@/lib/server/notify';
import { recordAudit } from '@/lib/server/audit';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  task_id: z.string().uuid(),
  body: z.string().trim().min(1, 'Comment cannot be empty').max(5000),
  /** 'ai_agent' is set by the SM when pasting an AI team update (paste mode). */
  source: z.enum(['human', 'ai_agent']).default('human'),
  /** Optional display name for a pasted AI agent update, e.g. "Claude Code". */
  author_name: z.string().trim().max(80).optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBoardComment(row: any): BoardComment {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const pasted = typeof row.metadata?.author_name === 'string' ? row.metadata.author_name : null;
  return {
    id: row.id,
    task_id: row.task_id,
    author_id: row.author_id ?? null,
    author_name:
      pasted ??
      profile?.full_name ??
      profile?.email ??
      (row.source === 'ai_agent' ? 'AI agent' : 'Unknown'),
    source: row.source,
    body: row.body,
    created_at: row.created_at,
  };
}

/** GET /api/comments?task_id=... — comment thread for one task, oldest first. */
export async function GET(request: Request) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  const taskId = new URL(request.url).searchParams.get('task_id');
  if (!taskId) return jsonError('task_id is required', 400);

  const { data, error } = await ctx.supabase
    .from('comments')
    .select('id, task_id, author_id, source, body, metadata, created_at, profiles(full_name, email)')
    .eq('task_id', taskId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) return jsonError(error.message, 400);

  return NextResponse.json({ comments: (data ?? []).map(toBoardComment) });
}

/** POST /api/comments — add a human comment, or a pasted AI agent update. */
export async function POST(request: Request) {
  const ctx = await requireOrg();
  if (isResponse(ctx)) return ctx;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { task_id, body, source, author_name } = parsed.data;

  // org_id is set by the trg_comments_org_match trigger from the task, which also
  // rejects a task the caller cannot see. Sending it here would be ignored anyway.
  const { data, error } = await ctx.supabase
    .from('comments')
    .insert({
      org_id: ctx.orgId,
      task_id,
      author_id: ctx.userId,
      source,
      body,
      metadata: source === 'ai_agent' && author_name ? { author_name } : {},
    })
    .select('id, task_id, author_id, source, body, metadata, created_at, profiles(full_name, email)')
    .single();

  if (error) return jsonError(error.message, 400);

  await recordAudit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'insert',
    table: 'comments',
    recordId: data.id,
    metadata: { task_id, source },
    request,
  });

  await notifyOnComment(ctx, task_id, body, source);

  return NextResponse.json({ comment: toBoardComment(data) }, { status: 201 });
}

/**
 * Tells the assignee and the reporter about a new comment, and anyone @mentioned
 * by name. Failures here never fail the comment itself.
 */
async function notifyOnComment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: { supabase: any; userId: string; orgId: string },
  taskId: string,
  body: string,
  source: 'human' | 'ai_agent'
) {
  try {
    const { data: task } = await ctx.supabase
      .from('tasks')
      .select('id, task_key, title, sprint_id, assignee_id, reporter_id')
      .eq('id', taskId)
      .maybeSingle();
    if (!task) return;

    const recipients = new Set<string>();
    if (task.assignee_id) recipients.add(task.assignee_id);
    if (task.reporter_id) recipients.add(task.reporter_id);

    // @mentions are matched against member names, which is what the comment box
    // offers; an unmatched @handle simply notifies nobody.
    const handles = Array.from(body.matchAll(/@([\w][\w.'-]*)/g)).map((m) => m[1].toLowerCase());
    let mentioned = false;
    if (handles.length > 0) {
      const { data: members } = await ctx.supabase
        .from('org_members')
        .select('user_id, profiles(id, full_name, email)')
        .eq('org_id', ctx.orgId)
        .is('deleted_at', null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const row of (members ?? []) as any[]) {
        const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const first = String(p?.full_name ?? '').split(/\s+/)[0].toLowerCase();
        const handle = String(p?.email ?? '').split('@')[0].toLowerCase();
        if (handles.some((h) => h === first || h === handle)) {
          recipients.add(p?.id ?? row.user_id);
          mentioned = true;
        }
      }
    }

    const type = source === 'ai_agent' ? 'ai_agent_update' : mentioned ? 'mention' : 'task_commented';
    const label = source === 'ai_agent' ? 'AI agent update' : 'New comment';

    await emitNotification({
      orgId: ctx.orgId,
      userIds: Array.from(recipients),
      actorId: ctx.userId,
      type,
      title: `${label} on ${task.task_key}`,
      body: body.length > 220 ? `${body.slice(0, 217)}…` : body,
      link: task.sprint_id ? `/sprints/${task.sprint_id}` : '/tasks',
      taskId: task.id,
      sprintId: task.sprint_id,
    });
  } catch (e) {
    console.error('[comments] notification fan-out failed', e instanceof Error ? e.message : e);
  }
}
