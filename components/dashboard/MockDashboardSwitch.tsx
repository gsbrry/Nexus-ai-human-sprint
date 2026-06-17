'use client';
import { usePreviewRole } from '@/components/app-shell/PreviewRoleProvider';
import { MemberDashboard } from '@/components/dashboard/MemberDashboard';
import { SmDashboard } from '@/components/dashboard/SmDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

/**
 * Demo / mock-mode dashboard. Picks one of three persona dashboards based on the
 * currently previewed role. Used when:
 *   - Supabase env vars are missing, OR
 *   - The user is in demo-cookie mode (no real Supabase session)
 *
 * Real authenticated users see <RealDashboard /> instead (see page.tsx).
 */
export function MockDashboardSwitch() {
  const { role } = usePreviewRole();
  if (role === 'org_admin' || role === 'super_admin') return <AdminDashboard />;
  if (role === 'scrum_master') return <SmDashboard />;
  return <MemberDashboard />;
}
