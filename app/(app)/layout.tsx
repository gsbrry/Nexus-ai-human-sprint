import { redirect } from 'next/navigation';
import { GoldStrip } from '@/components/brand/Logo';
import { Sidebar } from '@/components/app-shell/Sidebar';
import { Topbar } from '@/components/app-shell/Topbar';
import { PreviewRoleProvider } from '@/components/app-shell/PreviewRoleProvider';
import { createClient } from '@/lib/supabase/server';
import { isAuthConfigured } from '@/lib/auth-config';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let email: string | null = null;
  let fullName: string | null = null;
  let role: 'member' | 'scrum_master' | 'org_admin' | 'super_admin' = 'org_admin';

  if (isAuthConfigured()) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect('/login');
    }
    email = user.email ?? null;
    fullName = (user.user_metadata?.full_name as string | undefined) ?? null;
  } else {
    email = 'raphy@yallo.ai';
    fullName = 'Raphy Varghese';
  }

  const previewMode = !isAuthConfigured();

  return (
    <PreviewRoleProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <GoldStrip />
        <div className="flex flex-1 min-h-0">
          <Sidebar role={role} />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar title="Dashboard" email={email} fullName={fullName} role={role} previewMode={previewMode} />
            <div className="flex-1 overflow-auto">{children}</div>
          </div>
        </div>
      </div>
    </PreviewRoleProvider>
  );
}
