/**
 * Auth feature-flag based on Supabase env presence.
 * Used so the app renders cleanly even before .env.local is filled in.
 */
export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
