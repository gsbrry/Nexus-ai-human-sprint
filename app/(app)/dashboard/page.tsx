'use client';
import { usePreviewRole } from '@/components/app-shell/PreviewRoleProvider';
import { MemberDashboard } from '@/components/dashboard/MemberDashboard';
import { SmDashboard } from '@/components/dashboard/SmDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

export default function DashboardPage() {
  const { role } = usePreviewRole();
  if (role === 'org_admin') return <AdminDashboard />;
  if (role === 'scrum_master') return <SmDashboard />;
  return <MemberDashboard />;
}
