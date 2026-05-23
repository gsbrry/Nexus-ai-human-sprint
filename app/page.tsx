import { redirect } from 'next/navigation';
import { isAuthConfigured } from '@/lib/auth-config';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  if (isAuthConfigured()) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    redirect(user ? '/dashboard' : '/login');
  }
  // Pre-config: send straight to the login screen so the shell can be reviewed end-to-end.
  redirect('/login');
}
