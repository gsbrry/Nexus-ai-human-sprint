// Browser Supabase client — uses public anon key only.
// NEVER import this from server code; use /lib/supabase/server.ts instead.
// NOTE: Database generic omitted until real generated types replace the stub.
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
