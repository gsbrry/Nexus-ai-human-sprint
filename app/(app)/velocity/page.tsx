import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { RealVelocity } from '@/components/velocity/RealVelocity';
import { MockVelocityPage } from '@/components/velocity/MockVelocityPage';

export default async function VelocityPage() {
  let useReal = false;
  if (isAuthConfigured()) {
    if (!cookies().get('nexus_demo_user')?.value) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      useReal = Boolean(user);
    }
  }
  if (useReal) return <RealVelocity />;
  return <MockVelocityPage />;
}
