import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { RealProjectDetail } from '@/components/projects/RealProjectDetail';
import { MockProjectDetail } from '@/components/projects/MockProjectDetail';

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  let useReal = false;
  if (isAuthConfigured()) {
    if (!cookies().get('nexus_demo_user')?.value) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      useReal = Boolean(user);
    }
  }
  if (useReal) return <RealProjectDetail projectId={params.id} />;
  return <MockProjectDetail params={params} />;
}
