import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { RealSettings } from '@/components/settings/RealSettings';
import { MockSettings } from '@/components/settings/MockSettings';

export default async function SettingsPage() {
  // Inline feature flag (mirrors dashboard/projects/sprints/velocity pattern).
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
  if (useReal) return <RealSettings />;
  return <MockSettings />;
}
