import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { RealSprintDetail } from '@/components/sprints/RealSprintDetail';
import { MockSprintDetail } from '@/components/sprints/MockSprintDetail';

export default async function SprintDetailPage({ params }: { params: { id: string } }) {
  let useReal = false;
  if (isAuthConfigured()) {
    if (!cookies().get('nexus_demo_user')?.value) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      useReal = Boolean(user);
    }
  }
  if (useReal) return <RealSprintDetail sprintId={params.id} />;
  return <MockSprintDetail params={params} />;
}
