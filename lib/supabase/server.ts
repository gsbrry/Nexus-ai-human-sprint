// Server-side Supabase client.
// Reads/writes cookies for session, used in /app/api/* route handlers and server components.
// Uses the public anon key by default. Service-role client is exported separately and must
// only be used in trusted server contexts (never sent to the browser).
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// NOTE: We intentionally don't pass a Database generic here — the real generated
// types aren't in the repo yet (see types/database.ts). Until they are, calls
// return permissive row types instead of narrowing to `never`.

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // ignored — called from a Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // ignored — called from a Server Component
          }
        },
      },
    }
  );
}

/**
 * Service-role client — bypasses RLS. Use ONLY for admin tasks (webhooks, seeders,
 * background jobs). Never return this client or its key to the browser.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
