/**
 * Shared board domain types + helpers.
 *
 * These mirror the Supabase schema (see supabase/migrations/007_tasks.sql) and are
 * deliberately decoupled from `lib/mock/gbm`, so the Kanban board, task list and
 * task detail panel render identically against mock data and real data.
 *
 * `MockTask` / `MockUser` / `MockComment` are structurally assignable to the board
 * types below, so existing mock callers keep working unchanged.
 */

export type BoardStatus = 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done';
export type BoardPriority = 'low' | 'medium' | 'high' | 'critical';
export type BoardTaskType = 'feature' | 'bug' | 'chore' | 'spike' | 'epic';
export type BoardCommentSource = 'human' | 'ai_agent';
export type BoardColor = 'gold' | 'blue' | 'teal' | 'purple' | 'red' | 'amber' | 'green';

export type BoardUser = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  color: BoardColor;
  initials: string;
  /**
   * Agents sit in the same directory as people so one lookup serves both. Their
   * ids come from the `agents` table, humans' from `profiles`, and uuids do not
   * collide, so a single Map is safe.
   */
  kind?: 'human' | 'ai_agent';
  /** Agents only: paused agents stay visible but cannot take new work. */
  status?: 'active' | 'paused';
  /** Agents only: free-text provider, e.g. 'Claude Code'. */
  provider?: string | null;
};

export type BoardComment = {
  id: string;
  task_id: string;
  author_id: string | null;
  author_name: string;
  source: BoardCommentSource;
  body: string;
  created_at: string;
};

export type BoardTask = {
  id: string;
  task_key: string;
  project_id: string;
  sprint_id: string | null;
  title: string;
  description?: string | null;
  status: BoardStatus;
  priority: BoardPriority;
  type: BoardTaskType;
  assignee_id: string | null;
  /** Set instead of assignee_id when the owner is an AI agent. */
  agent_id?: string | null;
  reporter_id?: string | null;
  story_points: number | null;
  is_blocked: boolean;
  blocker_reason?: string | null;
  due_date: string | null;
  created_at?: string;
  completed_at?: string | null;
  /** Present on mock data and on the task detail panel; omitted on board queries. */
  comments?: BoardComment[];
  /** Cheap count used by the Kanban card when full comments aren't loaded. */
  comment_count?: number;
};

export const BOARD_STATUSES: BoardStatus[] = ['todo', 'in_progress', 'in_review', 'blocked', 'done'];

export function statusLabel(s: BoardStatus): string {
  return {
    todo: 'To do',
    in_progress: 'In progress',
    in_review: 'In review',
    blocked: 'Blocked',
    done: 'Done',
  }[s];
}

/** Number shown on a card's comment chip, whichever shape the task arrived in. */
/**
 * The task's owner, whichever kind it is. A task carries at most one of the two
 * (enforced by the tasks_single_assignee check), so this is unambiguous.
 */
export function ownerId(task: BoardTask): string | null {
  return task.assignee_id ?? task.agent_id ?? null;
}

export function commentCount(task: BoardTask): number {
  return task.comments?.length ?? task.comment_count ?? 0;
}

export function userMap(users: BoardUser[]): Map<string, BoardUser> {
  return new Map(users.map((u) => [u.id, u]));
}

const PALETTE: BoardColor[] = ['gold', 'blue', 'teal', 'purple', 'amber', 'green', 'red'];

/** Deterministic avatar colour for a real profile, which has no stored colour. */
export function colorForId(id: string): BoardColor {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function initialsFor(name: string | null | undefined, fallback = '?'): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Applies a status move to a task list, keeping the blocked/completed side-effects
 * consistent with the `trg_tasks_before_iu` trigger so optimistic UI matches the DB.
 */
export function applyStatusChange<T extends BoardTask>(tasks: T[], taskId: string, status: BoardStatus): T[] {
  return tasks.map((t) => {
    if (t.id !== taskId || t.status === status) return t;
    const next: T = { ...t, status };
    next.completed_at = status === 'done' ? new Date().toISOString() : null;
    if (status === 'blocked') {
      next.is_blocked = true;
      next.blocker_reason = t.blocker_reason ?? 'Newly blocked — reason pending.';
    } else {
      next.is_blocked = false;
      next.blocker_reason = null;
    }
    return next;
  });
}
