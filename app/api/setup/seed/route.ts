/**
 * Demo data seeder. Hits real Supabase tables via the service-role client.
 *
 * Idempotent: if the authenticated user already has an org, returns it as-is.
 * Otherwise creates:
 *   - 1 organisation ("NEXUS Studio")
 *   - Membership (current user as org_admin) — plus promotes to super_admin so SA-* screens unlock
 *   - 2 projects: YALLO + NEX
 *   - 2 sprints: 1 active, 1 planned
 *   - ~14 tasks with realistic distribution across statuses & priorities
 *
 * Returns counts so the UI can render a success summary.
 */
import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';

export async function POST() {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: 'Supabase not configured. Add keys to .env.local.' },
      { status: 503 }
    );
  }

  // 1. Require real authenticated user.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  const admin = createServiceClient();

  // 2. Short-circuit if user is already in an org.
  const { data: existingMembership } = await admin
    .from('org_members')
    .select('org_id, organisations(id, slug, name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (existingMembership?.org_id) {
    return NextResponse.json({
      already_seeded: true,
      org: existingMembership.organisations,
    });
  }

  // 3. Create organisation.
  const { data: org, error: orgErr } = await admin
    .from('organisations')
    .insert({
      slug: 'nexus',
      name: 'NEXUS Studio',
      created_by: user.id,
    })
    .select()
    .single();
  if (orgErr || !org) {
    return NextResponse.json({ error: orgErr?.message ?? 'org insert failed' }, { status: 500 });
  }

  // 4. Promote profile to super_admin (so SA screens unlock) + add as org_admin.
  await admin.from('profiles').update({ role: 'super_admin' }).eq('id', user.id);
  await admin.from('org_members').insert({
    org_id: org.id,
    user_id: user.id,
    role: 'org_admin',
  });

  // 5. Two projects.
  const projects = [
    {
      org_id: org.id,
      key: 'YALLO',
      name: 'AI Curriculum 2.0',
      description:
        'Modular AI fluency programme for L&D teams. 12-track curriculum with adaptive paths.',
      status: 'active',
      color: '#1a73e8',
      created_by: user.id,
      start_date: '2025-01-15',
      target_date: '2025-09-30',
    },
    {
      org_id: org.id,
      key: 'NEX',
      name: 'NEXUS Platform',
      description: 'Internal build of the project management platform that runs YALLO.',
      status: 'active',
      color: '#4a90e8',
      created_by: user.id,
      start_date: '2025-04-19',
      target_date: '2025-12-31',
    },
  ];
  const { data: insertedProjects } = await admin.from('projects').insert(projects).select();
  if (!insertedProjects || insertedProjects.length !== 2) {
    return NextResponse.json({ error: 'project seed failed' }, { status: 500 });
  }
  const [pYallo, pNex] = insertedProjects;

  // 6. Two sprints.
  const { data: insertedSprints } = await admin
    .from('sprints')
    .insert([
      {
        org_id: org.id,
        project_id: pYallo.id,
        name: 'Sprint 14 · Cohort 04 dry run',
        goal: 'Finish track 09–12 production builds, complete proctored capstone QA, and ship reviewer rubric v2.',
        status: 'active',
        start_date: '2025-06-08',
        end_date: '2025-06-22',
        sprint_number: 14,
        capacity_points: 40,
        created_by: user.id,
      },
      {
        org_id: org.id,
        project_id: pNex.id,
        name: 'Sprint 2 · Auth + core screens',
        goal: 'User logs in and sees YALLO tasks. Auth UI complete, project + task views populated.',
        status: 'active',
        start_date: '2025-06-08',
        end_date: '2025-06-11',
        sprint_number: 2,
        capacity_points: 16,
        created_by: user.id,
      },
    ])
    .select();
  if (!insertedSprints || insertedSprints.length !== 2) {
    return NextResponse.json({ error: 'sprint seed failed' }, { status: 500 });
  }
  const [sYallo, sNex] = insertedSprints;

  // 7. Tasks — distributed across statuses/priorities for nice dashboards.
  type SeedTask = {
    project_id: string;
    sprint_id: string | null;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done';
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: 'feature' | 'bug' | 'chore' | 'spike' | 'epic';
    story_points: number | null;
    is_blocked?: boolean;
    blocker_reason?: string;
    assignee_id?: string | null;
    reporter_id?: string | null;
  };
  const tasks: SeedTask[] = [
    // YALLO sprint 14
    { project_id: pYallo.id, sprint_id: sYallo.id, title: 'Track 09 production build · final cut', status: 'in_progress', priority: 'high', type: 'feature', story_points: 8, assignee_id: user.id, reporter_id: user.id },
    { project_id: pYallo.id, sprint_id: sYallo.id, title: 'Adaptive path engine · cohort 04 dry run', status: 'in_progress', priority: 'critical', type: 'feature', story_points: 13, is_blocked: true, blocker_reason: 'Waiting on data eng for cohort 04 export.', assignee_id: user.id, reporter_id: user.id },
    { project_id: pYallo.id, sprint_id: sYallo.id, title: 'Reviewer onboarding video · record and cut', status: 'todo', priority: 'medium', type: 'chore', story_points: 3, reporter_id: user.id },
    { project_id: pYallo.id, sprint_id: sYallo.id, title: 'AI grader · prompt injection regression suite', status: 'in_review', priority: 'high', type: 'feature', story_points: 5, reporter_id: user.id },
    { project_id: pYallo.id, sprint_id: sYallo.id, title: 'Mobile cohort lobby · 375px lockup', status: 'todo', priority: 'low', type: 'bug', story_points: 2, reporter_id: user.id },
    { project_id: pYallo.id, sprint_id: sYallo.id, title: 'Capstone proctor heartbeat · reconnect logic', status: 'done', priority: 'high', type: 'feature', story_points: 5, reporter_id: user.id },
    { project_id: pYallo.id, sprint_id: sYallo.id, title: 'Beta cohort 04 · welcome email batch', status: 'todo', priority: 'medium', type: 'chore', story_points: 2, reporter_id: user.id },
    { project_id: pYallo.id, sprint_id: sYallo.id, title: 'RAG bibliography · module 11 source review', status: 'in_progress', priority: 'medium', type: 'spike', story_points: 3, reporter_id: user.id },
    // YALLO backlog
    { project_id: pYallo.id, sprint_id: null, title: 'Cohort 05 onboarding email sequence', status: 'todo', priority: 'high', type: 'feature', story_points: 5, reporter_id: user.id },
    { project_id: pYallo.id, sprint_id: null, title: 'Track 11 · reviewer rubric v2 (peer-grading)', status: 'todo', priority: 'critical', type: 'feature', story_points: 13, reporter_id: user.id },
    // NEX sprint 2
    { project_id: pNex.id, sprint_id: sNex.id, title: 'A-01 Login + A-02 Register screens', status: 'done', priority: 'high', type: 'feature', story_points: 5, assignee_id: user.id, reporter_id: user.id },
    { project_id: pNex.id, sprint_id: sNex.id, title: 'A-03 Profile setup wizard', status: 'done', priority: 'medium', type: 'feature', story_points: 3, assignee_id: user.id, reporter_id: user.id },
    { project_id: pNex.id, sprint_id: sNex.id, title: 'Dashboard D-01 + project list P-01', status: 'in_progress', priority: 'high', type: 'feature', story_points: 5, assignee_id: user.id, reporter_id: user.id },
    { project_id: pNex.id, sprint_id: sNex.id, title: 'T-03 slide-in task detail panel', status: 'in_progress', priority: 'high', type: 'feature', story_points: 3, assignee_id: user.id, reporter_id: user.id },
  ];
  const { data: insertedTasks, error: taskErr } = await admin
    .from('tasks')
    .insert(tasks.map((t) => ({ ...t, org_id: org.id })))
    .select('id, status, sprint_id, story_points');
  if (taskErr) {
    return NextResponse.json({ error: taskErr.message }, { status: 500 });
  }

  return NextResponse.json({
    already_seeded: false,
    org: { id: org.id, slug: org.slug, name: org.name },
    projects: insertedProjects.length,
    sprints: insertedSprints.length,
    tasks: insertedTasks?.length ?? 0,
  });
}
