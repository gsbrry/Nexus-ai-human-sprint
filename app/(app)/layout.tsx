import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { GoldStrip } from '@/components/brand/Logo';
import { Sidebar } from '@/components/app-shell/Sidebar';
import { Topbar } from '@/components/app-shell/Topbar';
import { PreviewRoleProvider } from '@/components/app-shell/PreviewRoleProvider';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';
import { mockUsers } from '@/lib/mock/gbm';

type Role = 'member' | 'scrum_master' | 'org_admin' | 'super_admin';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let email: string | null = null;
  let fullName: string | null = null;
  let role: Role = 'org_admin';
  let demoUserId: string | null = null;

  // 1. Demo cookie wins — lets the user explore as any teammate without Supabase signup.
  const demoCookie = cookies().get('nexus_demo_user')?.value;
  if (demoCookie) {
    const u = mockUsers.find((mu) => mu.id === demoCookie);
    if (u) {
      demoUserId = u.id;
      email = u.email;
      fullName = u.name;
      role = u.role;
    }
  }

  // 2. Real Supabase session (only if no demo cookie).
  if (!demoUserId && isAuthConfigured()) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect('/login');
    }
    email = user.email ?? null;
    fullName = (user.user_metadata?.full_name as string | undefined) ?? null;
  } else if (!demoUserId && !isAuthConfigured()) {
    // 3. Mock fallback when nothing is configured.
    email = 'raphy@gbm.ai';
    fullName = 'Raphy Varghese';
  }

  // Preview mode = anything except a real authenticated Supabase user.
  const previewMode = Boolean(demoUserId) || !isAuthConfigured();

  return (
    <PreviewRoleProvider initialUserId={demoUserId ?? undefined} initialRole={demoUserId ? role : undefined}>
      <div className="min-h-screen flex flex-col bg-background">
        <GoldStrip />
        <div className="flex flex-1 min-h-0">
          <Sidebar role={role} />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar
              title="Dashboard"
              email={email}
              fullName={fullName}
              role={role}
              previewMode={previewMode}
              demoActive={Boolean(demoUserId)}
            />
            <div className="flex-1 overflow-auto">{children}</div>
          </div>
        </div>
      </div>
    </PreviewRoleProvider>
  );
}
