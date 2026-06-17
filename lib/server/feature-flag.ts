// Server-only feature-flag helper. Importing this from a client component will
// crash the build (which is the desired safety).
import 'server-only';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';

/**
 * Returns true only when:
 *   1. Supabase env vars are present
 *   2. The viewer is NOT in demo-cookie mode
 *   3. The viewer has a valid Supabase session
 *
 * Pages should branch on this to render real-data vs mock components.
 */
export async function useRealData(): Promise<boolean> {
  if (!isAuthConfigured()) return false;
  if (cookies().get('nexus_demo_user')?.value) return false;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user);
}

/**
 * Returns the active user's primary org membership, or null. Used by every
 * server component that scopes queries to the current workspace.
 */
export async function getActiveOrg() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('org_members')
    .select('org_id, role, organisations(id, slug, name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { ...data, user };
}
