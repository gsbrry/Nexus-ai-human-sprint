import { NextResponse } from 'next/server';

// Returns a small sample CSV the user can download to try the import flow.
const SAMPLE = `title,description,type,priority,story_points,assignee,due_date
Draft track 13 module outline,Storyboard the 6 lessons and assessment plan for track 13.,feature,high,5,Aria Chen,2025-07-04
Fix Mux video playback on iOS Safari,Heartbeat freezes when player goes to background.,bug,critical,3,Marcus Alden,2025-06-25
Refresh reviewer onboarding deck,New screenshots from the updated reviewer UI.,chore,medium,2,Layla Kim,2025-06-30
Spike: RAG citation lineage in module 11,Investigate why some citations point to deprecated sources.,spike,medium,5,Aria Chen,2025-07-01
Cohort 05 welcome email A/B test,Two variants; send 50/50 split with open-rate tracking.,chore,low,2,Shreya Patel,2025-07-06
Proctor session recording retention,Auto-purge after 30 days unless flagged.,feature,high,8,Marcus Alden,2025-07-10
Capstone rubric v2 — reviewer edits,Apply Layla\'s feedback from the design review.,feature,medium,3,Layla Kim,2025-06-28
Login Telegram link flow,Settings → Telegram link with deep-link verify.,feature,medium,3,Raphy Varghese,2025-07-12
`;

export async function GET() {
  return new NextResponse(SAMPLE, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="nexus-sample-tasks.csv"',
    },
  });
}
