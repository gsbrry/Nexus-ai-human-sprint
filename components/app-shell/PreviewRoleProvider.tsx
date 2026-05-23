'use client';
import { createContext, useContext, useMemo, useState } from 'react';
import { CURRENT_USER_ID, userById, type MockUser } from '@/lib/mock/yallo';

type PreviewRole = 'member' | 'scrum_master' | 'org_admin';

type Ctx = {
  role: PreviewRole;
  setRole: (r: PreviewRole) => void;
  user: MockUser;
};

const PreviewRoleCtx = createContext<Ctx | null>(null);

export function PreviewRoleProvider({ children }: { children: React.ReactNode }) {
  const me = userById(CURRENT_USER_ID)!;
  const initial: PreviewRole =
    me.role === 'org_admin' || me.role === 'super_admin'
      ? 'org_admin'
      : me.role === 'scrum_master'
      ? 'scrum_master'
      : 'member';
  const [role, setRole] = useState<PreviewRole>(initial);
  const value = useMemo(() => ({ role, setRole, user: me }), [role, me]);
  return <PreviewRoleCtx.Provider value={value}>{children}</PreviewRoleCtx.Provider>;
}

export function usePreviewRole(): Ctx {
  const ctx = useContext(PreviewRoleCtx);
  if (!ctx) throw new Error('usePreviewRole must be used inside PreviewRoleProvider');
  return ctx;
}
