// GBM AI Academy mock data. Used everywhere until Supabase migrations are run
// and the dev_seed.sql is loaded. Drop-in replacements use the same shape as the
// future supabase types.

export type MockRole = 'member' | 'scrum_master' | 'org_admin' | 'super_admin';
export type MockTaskStatus = 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done';
export type MockTaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type MockTaskType = 'feature' | 'bug' | 'chore' | 'spike' | 'epic';
export type MockCommentSource = 'human' | 'ai_agent';
export type MockOwnerColor = 'gold' | 'blue' | 'teal' | 'purple' | 'red' | 'amber' | 'green';

export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: MockRole;
  color: MockOwnerColor;
  initials: string;
};

export type MockProject = {
  id: string;
  key: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  color: string;
  created_by: string;
  start_date: string;
  target_date: string;
  members: string[]; // user ids
};

export type MockSprint = {
  id: string;
  project_id: string;
  name: string;
  goal: string;
  status: 'planned' | 'active' | 'completed';
  start_date: string;
  end_date: string;
  sprint_number: number;
  capacity_points: number;
};

export type MockComment = {
  id: string;
  task_id: string;
  author_id: string | null;
  author_name: string;
  source: MockCommentSource;
  body: string;
  created_at: string;
};

export type MockTask = {
  id: string;
  task_key: string;
  project_id: string;
  sprint_id: string | null;
  title: string;
  description: string;
  status: MockTaskStatus;
  priority: MockTaskPriority;
  type: MockTaskType;
  assignee_id: string | null;
  reporter_id: string;
  story_points: number | null;
  is_blocked: boolean;
  blocker_reason?: string;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  comments: MockComment[];
};

// ---------------------------------------------------------------------------
// Users (the GBM build team)
// ---------------------------------------------------------------------------
export const mockUsers: MockUser[] = [
  { id: 'u-raphy', name: 'Raphy Varghese', email: 'raphy@gbm.ai', role: 'org_admin', color: 'gold', initials: 'RV' },
  { id: 'u-marcus', name: 'Marcus Alden', email: 'marcus@gbm.ai', role: 'scrum_master', color: 'blue', initials: 'MA' },
  { id: 'u-david', name: 'David Rowe', email: 'david@gbm.ai', role: 'member', color: 'gold', initials: 'DR' },
  { id: 'u-anay', name: 'Anay Goenka', email: 'anay@gbm.ai', role: 'member', color: 'teal', initials: 'AG' },
  { id: 'u-aria', name: 'Aria Chen', email: 'aria@gbm.ai', role: 'member', color: 'purple', initials: 'AC' },
  { id: 'u-layla', name: 'Layla Kim', email: 'layla@gbm.ai', role: 'member', color: 'amber', initials: 'LK' },
  { id: 'u-nina', name: 'Nina Torres', email: 'nina@gbm.ai', role: 'member', color: 'red', initials: 'NT' },
  { id: 'u-shreya', name: 'Shreya Patel', email: 'shreya@gbm.ai', role: 'scrum_master', color: 'green', initials: 'SP' },
];

// The current viewer in preview mode. Switch to Raphy so dashboards show admin view.
export const CURRENT_USER_ID = 'u-raphy';

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export const mockProjects: MockProject[] = [
  {
    id: 'p-gbm',
    key: 'GBM',
    name: 'GBM Curriculum 2.0',
    description:
      'Modular AI fluency programme for L&D teams. 12-track curriculum with adaptive paths, agent labs, and proctored capstones.',
    status: 'active',
    color: '#1a73e8',
    created_by: 'u-raphy',
    start_date: '2025-04-01',
    target_date: '2025-08-30',
    members: ['u-raphy', 'u-marcus', 'u-david', 'u-anay', 'u-aria', 'u-layla', 'u-nina', 'u-shreya'],
  },
  {
    id: 'p-nexus',
    key: 'NEX',
    name: 'NEXUS Platform',
    description: 'Internal build of the project management platform that runs GBM.',
    status: 'active',
    color: '#7F77DD',
    created_by: 'u-marcus',
    start_date: '2025-05-15',
    target_date: '2025-06-30',
    members: ['u-raphy', 'u-marcus', 'u-david', 'u-anay', 'u-aria', 'u-layla', 'u-nina', 'u-shreya'],
  },
];

// ---------------------------------------------------------------------------
// Sprints
// ---------------------------------------------------------------------------
export const mockSprints: MockSprint[] = [
  {
    id: 's-gbm-14',
    project_id: 'p-gbm',
    name: 'Sprint 14 · Launch readiness',
    goal: 'Finish track 09–12 production builds, complete proctored capstone QA, and seed beta cohort 04.',
    status: 'active',
    start_date: '2025-06-09',
    end_date: '2025-06-23',
    sprint_number: 14,
    capacity_points: 64,
  },
  {
    id: 's-nex-2',
    project_id: 'p-nexus',
    name: 'Sprint 2 · Auth + core screens',
    goal: 'User logs in and sees GBM tasks. Auth UI complete, project + task views populated.',
    status: 'active',
    start_date: '2025-06-08',
    end_date: '2025-06-11',
    sprint_number: 2,
    capacity_points: 24,
  },
];

// ---------------------------------------------------------------------------
// Tasks (GBM + a few NEXUS for context)
// ---------------------------------------------------------------------------
export const mockTasks: MockTask[] = [
  // ===== GBM sprint 14 =====
  {
    id: 't-1',
    task_key: 'GBM-142',
    project_id: 'p-gbm',
    sprint_id: 's-gbm-14',
    title: 'Track 09 · prompt engineering capstone scaffold',
    description:
      'Build the proctored capstone scaffold for Track 09 (prompt engineering). Includes rubric upload, AI grader hook-in, and reviewer dual-pass UI.',
    status: 'in_progress',
    priority: 'high',
    type: 'feature',
    assignee_id: 'u-raphy',
    reporter_id: 'u-shreya',
    story_points: 8,
    is_blocked: false,
    due_date: '2025-06-20',
    created_at: '2025-06-09T09:00:00Z',
    completed_at: null,
    comments: [
      {
        id: 'c-1',
        task_id: 't-1',
        author_id: 'u-layla',
        author_name: 'Layla Kim',
        source: 'human',
        body: 'Rubric upload step needs the same drag-drop UX as the CSV import. Reusing those components.',
        created_at: '2025-06-10T10:14:00Z',
      },
      {
        id: 'c-2',
        task_id: 't-1',
        author_id: null,
        author_name: 'Aria · Reviewer Agent',
        source: 'ai_agent',
        body: 'Drafted dual-pass review JSON schema. 7 fields, version 0.3. Ready for human spot-check before binding to the API contract.',
        created_at: '2025-06-10T11:48:00Z',
      },
    ],
  },
  {
    id: 't-2',
    task_key: 'GBM-143',
    project_id: 'p-gbm',
    sprint_id: 's-gbm-14',
    title: 'Adaptive path engine · cohort 04 dry run',
    description:
      'Dry-run the adaptive path engine against cohort 04 sample data (n=120). Surface any path collapse cases where the engine routes <3 modules.',
    status: 'in_progress',
    priority: 'critical',
    type: 'feature',
    assignee_id: 'u-marcus',
    reporter_id: 'u-raphy',
    story_points: 13,
    is_blocked: true,
    blocker_reason: 'Waiting on data eng to produce the cohort 04 anonymised export (ETA today).',
    due_date: '2025-06-18',
    created_at: '2025-06-09T11:30:00Z',
    completed_at: null,
    comments: [
      {
        id: 'c-3',
        task_id: 't-2',
        author_id: 'u-marcus',
        author_name: 'Marcus Alden',
        source: 'human',
        body: 'Blocker logged. Pinged data eng on Slack at 09:42. If still blocked at EOD I will escalate to @Raphy.',
        created_at: '2025-06-10T09:42:00Z',
      },
    ],
  },
  {
    id: 't-3',
    task_key: 'GBM-144',
    project_id: 'p-gbm',
    sprint_id: 's-gbm-14',
    title: 'Reviewer onboarding video · record and cut',
    description: 'Record the 6-minute reviewer onboarding video. Cut, subtitle, and host on Mux. Embed in Track 09 reviewer view.',
    status: 'todo',
    priority: 'medium',
    type: 'chore',
    assignee_id: 'u-layla',
    reporter_id: 'u-shreya',
    story_points: 3,
    is_blocked: false,
    due_date: '2025-06-22',
    created_at: '2025-06-09T13:00:00Z',
    completed_at: null,
    comments: [],
  },
  {
    id: 't-4',
    task_key: 'GBM-145',
    project_id: 'p-gbm',
    sprint_id: 's-gbm-14',
    title: 'AI grader · prompt injection regression suite',
    description:
      'Build 24 test cases covering known prompt-injection vectors against the AI grader. Must pass on every PR touching the grader.',
    status: 'in_review',
    priority: 'high',
    type: 'feature',
    assignee_id: 'u-aria',
    reporter_id: 'u-nina',
    story_points: 5,
    is_blocked: false,
    due_date: '2025-06-16',
    created_at: '2025-06-09T14:00:00Z',
    completed_at: null,
    comments: [
      {
        id: 'c-4',
        task_id: 't-4',
        author_id: 'u-nina',
        author_name: 'Nina Torres',
        source: 'human',
        body: '22/24 passing. Edge cases left: nested system prompt smuggling, and rubric-leak via base64. Aria, want me to write fixtures?',
        created_at: '2025-06-11T08:20:00Z',
      },
    ],
  },
  {
    id: 't-5',
    task_key: 'GBM-146',
    project_id: 'p-gbm',
    sprint_id: 's-gbm-14',
    title: 'Mobile cohort lobby · 375px lockup',
    description: 'Cohort lobby renders correctly at 375px. Avatar stack truncates, header pill stays single-line.',
    status: 'todo',
    priority: 'low',
    type: 'bug',
    assignee_id: 'u-anay',
    reporter_id: 'u-layla',
    story_points: 2,
    is_blocked: false,
    due_date: '2025-06-19',
    created_at: '2025-06-09T15:30:00Z',
    completed_at: null,
    comments: [],
  },
  {
    id: 't-6',
    task_key: 'GBM-147',
    project_id: 'p-gbm',
    sprint_id: 's-gbm-14',
    title: 'Capstone proctor heartbeat · reconnect logic',
    description:
      'Browser proctor heartbeat must reconnect on transient network loss without flagging the candidate. Backoff 1s→5s→15s.',
    status: 'done',
    priority: 'high',
    type: 'feature',
    assignee_id: 'u-marcus',
    reporter_id: 'u-nina',
    story_points: 5,
    is_blocked: false,
    due_date: '2025-06-14',
    created_at: '2025-06-09T10:00:00Z',
    completed_at: '2025-06-11T16:00:00Z',
    comments: [],
  },
  {
    id: 't-7',
    task_key: 'GBM-148',
    project_id: 'p-gbm',
    sprint_id: 's-gbm-14',
    title: 'Beta cohort 04 · welcome email batch',
    description: 'Compose, A/B test, and queue the welcome email batch for cohort 04. Send window 2025-06-23 08:00 UTC.',
    status: 'todo',
    priority: 'medium',
    type: 'chore',
    assignee_id: 'u-shreya',
    reporter_id: 'u-raphy',
    story_points: 2,
    is_blocked: false,
    due_date: '2025-06-22',
    created_at: '2025-06-10T08:00:00Z',
    completed_at: null,
    comments: [],
  },
  {
    id: 't-8',
    task_key: 'GBM-149',
    project_id: 'p-gbm',
    sprint_id: 's-gbm-14',
    title: 'RAG bibliography · module 11 source review',
    description: 'Review the 47 source citations the RAG layer is pulling for module 11. Flag any non-peer-reviewed material.',
    status: 'in_progress',
    priority: 'medium',
    type: 'spike',
    assignee_id: 'u-aria',
    reporter_id: 'u-raphy',
    story_points: 3,
    is_blocked: false,
    due_date: '2025-06-17',
    created_at: '2025-06-10T11:00:00Z',
    completed_at: null,
    comments: [
      {
        id: 'c-5',
        task_id: 't-8',
        author_id: null,
        author_name: 'Aria · RAG Agent',
        source: 'ai_agent',
        body: '14/47 sources flagged as non-peer-reviewed (mostly blog posts, 3 vendor whitepapers). Suggesting replacements drawn from the academic corpus index. Diff attached as comment-5-replacements.json.',
        created_at: '2025-06-11T09:10:00Z',
      },
    ],
  },
  // ===== NEXUS sprint 2 (so Raphy can see his own build inside Nexus) =====
  {
    id: 't-n1',
    task_key: 'NEX-21',
    project_id: 'p-nexus',
    sprint_id: 's-nex-2',
    title: 'Auth screens A-01…A-04',
    description: 'Login, register, forgot/reset password — matching GBM theme.',
    status: 'done',
    priority: 'high',
    type: 'feature',
    assignee_id: 'u-anay',
    reporter_id: 'u-marcus',
    story_points: 5,
    is_blocked: false,
    due_date: '2025-06-10',
    created_at: '2025-06-08T09:00:00Z',
    completed_at: '2025-06-11T17:00:00Z',
    comments: [],
  },
  {
    id: 't-n2',
    task_key: 'NEX-22',
    project_id: 'p-nexus',
    sprint_id: 's-nex-2',
    title: 'App shell · sidebar + topbar',
    description: 'Numbered nav, gold-bordered active state, topbar with avatar dropdown.',
    status: 'done',
    priority: 'high',
    type: 'feature',
    assignee_id: 'u-marcus',
    reporter_id: 'u-raphy',
    story_points: 3,
    is_blocked: false,
    due_date: '2025-06-10',
    created_at: '2025-06-08T10:00:00Z',
    completed_at: '2025-06-11T17:30:00Z',
    comments: [],
  },
  {
    id: 't-n3',
    task_key: 'NEX-23',
    project_id: 'p-nexus',
    sprint_id: 's-nex-2',
    title: 'Dashboard D-01 + project list P-01',
    description: 'GBM mock data drives dashboard stats, recent tasks, and project list.',
    status: 'in_progress',
    priority: 'high',
    type: 'feature',
    assignee_id: 'u-anay',
    reporter_id: 'u-marcus',
    story_points: 5,
    is_blocked: false,
    due_date: '2025-06-11',
    created_at: '2025-06-09T09:00:00Z',
    completed_at: null,
    comments: [],
  },
  {
    id: 't-n4',
    task_key: 'NEX-24',
    project_id: 'p-nexus',
    sprint_id: 's-nex-2',
    title: 'T-03 slide-in task detail panel',
    description: 'Per @Layla — slide-in side panel on desktop, bottom sheet on mobile. Comment filter pills: All · Human · AI Agent.',
    status: 'in_progress',
    priority: 'high',
    type: 'feature',
    assignee_id: 'u-anay',
    reporter_id: 'u-layla',
    story_points: 3,
    is_blocked: false,
    due_date: '2025-06-11',
    created_at: '2025-06-09T11:00:00Z',
    completed_at: null,
    comments: [],
  },
  // ===== Backlog tasks (no sprint assignment yet) =====
  {
    id: 't-b1',
    task_key: 'GBM-160',
    project_id: 'p-gbm',
    sprint_id: null,
    title: 'Cohort 05 onboarding email sequence · 7-email drip',
    description:
      'Design and draft the cohort 05 onboarding drip (7 emails over 10 days). Hand off to @Shreya for copy review and to Nina for the legal disclaimer block.',
    status: 'todo',
    priority: 'high',
    type: 'feature',
    assignee_id: null,
    reporter_id: 'u-raphy',
    story_points: 5,
    is_blocked: false,
    due_date: null,
    created_at: '2025-06-10T09:00:00Z',
    completed_at: null,
    comments: [],
  },
  {
    id: 't-b2',
    task_key: 'GBM-161',
    project_id: 'p-gbm',
    sprint_id: null,
    title: 'Track 11 · reviewer rubric v2 (peer-grading)',
    description:
      'Replace the v1 rubric with the new 6-axis peer-grading model. Validate against last 200 graded submissions and check inter-rater agreement >= 0.78.',
    status: 'todo',
    priority: 'critical',
    type: 'feature',
    assignee_id: 'u-aria',
    reporter_id: 'u-nina',
    story_points: 13,
    is_blocked: false,
    due_date: null,
    created_at: '2025-06-10T10:30:00Z',
    completed_at: null,
    comments: [
      {
        id: 'c-b2-1',
        task_id: 't-b2',
        author_id: null,
        author_name: 'Aria · RAG Agent',
        source: 'ai_agent',
        body: 'Pulled 12 peer-reviewed sources on inter-rater reliability in adaptive assessment. Recommending Cohen\u2019s kappa over raw % agreement. Drafted axis definitions attached.',
        created_at: '2025-06-11T07:15:00Z',
      },
    ],
  },
  {
    id: 't-b3',
    task_key: 'GBM-162',
    project_id: 'p-gbm',
    sprint_id: null,
    title: 'AI grader · streaming token rate-limit',
    description:
      'Introduce a per-cohort token bucket on the grader so a single runaway prompt cannot exhaust the daily budget. 50K tokens/cohort/day default.',
    status: 'todo',
    priority: 'medium',
    type: 'feature',
    assignee_id: null,
    reporter_id: 'u-marcus',
    story_points: 5,
    is_blocked: false,
    due_date: null,
    created_at: '2025-06-10T11:45:00Z',
    completed_at: null,
    comments: [],
  },
  {
    id: 't-b4',
    task_key: 'GBM-163',
    project_id: 'p-gbm',
    sprint_id: null,
    title: 'Mobile · capstone proctor PWA install prompt',
    description:
      'Add the add-to-home-screen prompt on Android and the Safari install nudge on iOS. Track install rate by cohort and surface in admin.',
    status: 'todo',
    priority: 'low',
    type: 'chore',
    assignee_id: 'u-layla',
    reporter_id: 'u-anay',
    story_points: 2,
    is_blocked: false,
    due_date: null,
    created_at: '2025-06-10T13:00:00Z',
    completed_at: null,
    comments: [],
  },
  {
    id: 't-b5',
    task_key: 'NEX-30',
    project_id: 'p-nexus',
    sprint_id: null,
    title: 'N-01 Notification centre',
    description:
      'Slide-out notification panel triggered from the topbar bell. Group by Today / Earlier. Filter pills: All · Mentions · AI · System.',
    status: 'todo',
    priority: 'high',
    type: 'feature',
    assignee_id: 'u-anay',
    reporter_id: 'u-raphy',
    story_points: 5,
    is_blocked: false,
    due_date: null,
    created_at: '2025-06-11T08:00:00Z',
    completed_at: null,
    comments: [],
  },
  {
    id: 't-b6',
    task_key: 'NEX-31',
    project_id: 'p-nexus',
    sprint_id: null,
    title: 'N-02 / N-03 Settings · profile + organisation',
    description:
      'Two settings screens: user profile (avatar, name, anthropic key) and org settings (members, invites, default project). Strict GBM design tokens.',
    status: 'todo',
    priority: 'high',
    type: 'feature',
    assignee_id: 'u-anay',
    reporter_id: 'u-layla',
    story_points: 8,
    is_blocked: false,
    due_date: null,
    created_at: '2025-06-11T08:30:00Z',
    completed_at: null,
    comments: [],
  },
  {
    id: 't-b7',
    task_key: 'NEX-32',
    project_id: 'p-nexus',
    sprint_id: null,
    title: 'N-04 Invite flow · email + Telegram handoff',
    description:
      'Magic-link invite via Resend, fallback Telegram notification when org has a bot configured. Token expires in 7 days.',
    status: 'todo',
    priority: 'medium',
    type: 'feature',
    assignee_id: null,
    reporter_id: 'u-raphy',
    story_points: 5,
    is_blocked: false,
    due_date: null,
    created_at: '2025-06-11T09:15:00Z',
    completed_at: null,
    comments: [],
  },
  {
    id: 't-b8',
    task_key: 'NEX-33',
    project_id: 'p-nexus',
    sprint_id: null,
    title: 'V-03 polish · weekend dimming + scope-creep band',
    description:
      'Dim weekend dates on the burndown chart and overlay a translucent gold band when scope was added mid-sprint.',
    status: 'todo',
    priority: 'low',
    type: 'chore',
    assignee_id: 'u-anay',
    reporter_id: 'u-marcus',
    story_points: 2,
    is_blocked: false,
    due_date: null,
    created_at: '2025-06-11T10:00:00Z',
    completed_at: null,
    comments: [],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function userById(id: string | null | undefined): MockUser | undefined {
  if (!id) return undefined;
  return mockUsers.find((u) => u.id === id);
}

export function projectById(id: string | null | undefined): MockProject | undefined {
  if (!id) return undefined;
  return mockProjects.find((p) => p.id === id);
}

export function projectByKey(key: string): MockProject | undefined {
  return mockProjects.find((p) => p.key.toLowerCase() === key.toLowerCase());
}

export function activeSprintForProject(projectId: string): MockSprint | undefined {
  return mockSprints.find((s) => s.project_id === projectId && s.status === 'active');
}

export function tasksForSprint(sprintId: string): MockTask[] {
  return mockTasks.filter((t) => t.sprint_id === sprintId);
}

export function tasksForProject(projectId: string): MockTask[] {
  return mockTasks.filter((t) => t.project_id === projectId);
}

export function tasksAssignedTo(userId: string): MockTask[] {
  return mockTasks.filter((t) => t.assignee_id === userId);
}

export function statusLabel(s: MockTaskStatus): string {
  return {
    todo: 'To do',
    in_progress: 'In progress',
    in_review: 'In review',
    blocked: 'Blocked',
    done: 'Done',
  }[s];
}
