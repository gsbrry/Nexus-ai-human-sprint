import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { RealBacklog } from '@/components/sprints/RealBacklog';
import { MockBacklog } from '@/components/sprints/MockBacklog';

export default async function BacklogPage() {
  let useReal = false;
  if (isAuthConfigured()) {
    if (!cookies().get('nexus_demo_user')?.value) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      useReal = Boolean(user);
    }
  }
  if (useReal) return <RealBacklog />;
  return <MockBacklog />;
}
