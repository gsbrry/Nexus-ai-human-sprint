import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { RealSprintsList } from '@/components/sprints/RealSprintsList';
import { MockSprintsList } from '@/components/sprints/MockSprintsList';

export default async function SprintsPage() {
  let useReal = false;
  if (isAuthConfigured()) {
    if (!cookies().get('nexus_demo_user')?.value) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      useReal = Boolean(user);
    }
  }
  if (useReal) return <RealSprintsList />;
  return <MockSprintsList />;
}
