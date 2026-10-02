'use client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ProfileTab } from '@/components/settings/tabs/ProfileTab';
import { OrgTab } from '@/components/settings/tabs/OrgTab';
import { MembersTab } from '@/components/settings/tabs/MembersTab';
import { ApiKeysTab } from '@/components/settings/tabs/ApiKeysTab';
import { NotificationsTab } from '@/components/settings/tabs/NotificationsTab';

/** N-02 / N-03 against real Supabase data. */
export function RealSettings() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            N-02 / N-03 · Settings
          </div>
          <Badge variant="gold" className="font-mono">Real DB</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Your profile, your workspace, and the optional keys that let Nexus talk to Claude and
          Telegram. Nexus works without either.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="org">Organisation</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="keys">API keys</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="org" className="mt-6">
          <OrgTab />
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <MembersTab />
        </TabsContent>
        <TabsContent value="keys" className="mt-6">
          <ApiKeysTab />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
