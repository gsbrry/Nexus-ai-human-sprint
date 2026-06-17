import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { RealDashboard } from '@/components/dashboard/RealDashboard';
import { MockDashboardSwitch } from '@/components/dashboard/MockDashboardSwitch';

export default async function DashboardPage() {
  // Inline feature flag (kept here to avoid a transitive next/headers import chain
  // that Next.js 14.2.x fails to statically analyse).
  let useReal = false;
  if (isAuthConfigured()) {
    const demoCookie = cookies().get('nexus_demo_user')?.value;
    if (!demoCookie) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      useReal = Boolean(user);
    }
  }
  if (useReal) return <RealDashboard />;
  return <MockDashboardSwitch />;
}
