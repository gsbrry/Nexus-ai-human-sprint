import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { RealMyTasks } from '@/components/tasks/RealMyTasks';
import { MockMyTasks } from '@/components/tasks/MockMyTasks';

export default async function TasksPage() {
  let useReal = false;
  if (isAuthConfigured()) {
    if (!cookies().get('nexus_demo_user')?.value) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      useReal = Boolean(user);
    }
  }
  if (useReal) return <RealMyTasks />;
  return <MockMyTasks />;
}
