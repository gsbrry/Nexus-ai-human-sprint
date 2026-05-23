// Historical sprint velocity (mock). Real data will come from velocity_snapshots
// after sprint completion jobs run (migration 009).

import { mockUsers } from './yallo';

export type SprintVelocity = {
  sprint_number: number;
  name: string;
  start_date: string;
  end_date: string;
  points_committed: number;
  points_completed: number;
  tasks_committed: number;
  tasks_completed: number;
};

// Last 6 sprints of YALLO AI Curriculum project, including the active one.
export const yalloVelocity: SprintVelocity[] = [
  {
    sprint_number: 9,
    name: 'Track 04 spike',
    start_date: '2025-03-31',
    end_date: '2025-04-14',
    points_committed: 42,
    points_completed: 38,
    tasks_committed: 14,
    tasks_completed: 13,
  },
  {
    sprint_number: 10,
    name: 'Adaptive engine v1',
    start_date: '2025-04-14',
    end_date: '2025-04-28',
    points_committed: 48,
    points_completed: 45,
    tasks_committed: 16,
    tasks_completed: 15,
  },
  {
    sprint_number: 11,
    name: 'Reviewer tools',
    start_date: '2025-04-28',
    end_date: '2025-05-12',
    points_committed: 52,
    points_completed: 34,
    tasks_committed: 18,
    tasks_completed: 12,
  },
  {
    sprint_number: 12,
    name: 'Capstone v1',
    start_date: '2025-05-12',
    end_date: '2025-05-26',
    points_committed: 50,
    points_completed: 48,
    tasks_committed: 17,
    tasks_completed: 17,
  },
  {
    sprint_number: 13,
    name: 'Track 05–08',
    start_date: '2025-05-26',
    end_date: '2025-06-09',
    points_committed: 55,
    points_completed: 52,
    tasks_committed: 19,
    tasks_completed: 18,
  },
  {
    sprint_number: 14,
    name: 'Launch readiness',
    start_date: '2025-06-09',
    end_date: '2025-06-23',
    points_committed: 41,
    points_completed: 5, // active, in progress
    tasks_committed: 8,
    tasks_completed: 1,
  },
];

export type MemberVelocity = {
  user_id: string;
  // Points completed across the last 6 sprints (newest last)
  series: number[];
  // Lifetime totals
  total_pts: number;
  total_tasks: number;
  // Average per sprint
  avg_pts: number;
};

// Per-member historical velocity (rough buckets aligned with team realism)
function series(arr: number[]): MemberVelocity {
  const total_pts = arr.reduce((s, v) => s + v, 0);
  return {
    user_id: '',
    series: arr,
    total_pts,
    total_tasks: Math.round(total_pts / 3),
    avg_pts: Math.round((total_pts / arr.length) * 10) / 10,
  };
}

export const memberVelocity: MemberVelocity[] = [
  { ...series([8, 10, 6, 11, 13, 1]), user_id: 'u-raphy' },     // org_admin — lighter load
  { ...series([12, 13, 8, 14, 13, 0]), user_id: 'u-marcus' },   // scrum_master
  { ...series([5, 6, 5, 7, 8, 0]), user_id: 'u-david' },        // member
  { ...series([6, 5, 4, 5, 6, 0]), user_id: 'u-anay' },         // junior
  { ...series([8, 11, 7, 11, 13, 0]), user_id: 'u-aria' },      // AI eng
  { ...series([4, 6, 3, 5, 7, 0]), user_id: 'u-layla' },        // design
  { ...series([3, 4, 3, 4, 5, 0]), user_id: 'u-nina' },         // QA (joins later)
  { ...series([4, 5, 4, 5, 5, 2]), user_id: 'u-shreya' },       // SM
];

export const memberVelocityByUser = memberVelocity.reduce<Record<string, MemberVelocity>>(
  (acc, m) => ((acc[m.user_id] = m), acc),
  {}
);

// Helpers ------------------------------------------------------------
export function orgAvgVelocity(): number {
  const completed = yalloVelocity
    .slice(0, -1) // exclude active sprint
    .map((s) => s.points_completed);
  return Math.round((completed.reduce((s, v) => s + v, 0) / completed.length) * 10) / 10;
}

export function orgPredictedNext(): number {
  // Weighted: last 3 sprints, more weight to the newest
  const last3 = yalloVelocity.slice(-4, -1);
  if (last3.length === 0) return 0;
  const weights = [1, 1.5, 2];
  const num = last3.reduce((s, sp, i) => s + sp.points_completed * weights[i], 0);
  const den = weights.reduce((s, w) => s + w, 0);
  return Math.round(num / den);
}

export function orgCompletionRate(): number {
  const completed = yalloVelocity
    .slice(0, -1)
    .reduce((s, sp) => ({ c: s.c + sp.points_completed, t: s.t + sp.points_committed }), { c: 0, t: 0 });
  return Math.round((completed.c / Math.max(1, completed.t)) * 100);
}

// Roll-up of a member's stats for cards (used by V-02)
export function memberStats(userId: string) {
  const v = memberVelocityByUser[userId];
  const user = mockUsers.find((u) => u.id === userId);
  if (!v || !user) return null;
  return {
    user,
    avg: v.avg_pts,
    total: v.total_pts,
    lastCompleted: v.series.slice(0, -1).slice(-1)[0] ?? 0,
    series: v.series,
  };
}
