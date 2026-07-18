// Auto-generated types will replace this file once Supabase migrations are run.
// Run: npx supabase gen types typescript --project-id <id> > types/database.ts
// Until then, this stub keeps the TypeScript compiler happy.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Permissive stub: until real generated types land, every row is `any` so that
// `.select('a, b, c')` queries don't narrow to `never`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

export interface Database {
  public: {
    Tables: Record<string, { Row: AnyRow; Insert: AnyRow; Update: AnyRow }>;
    Views: Record<string, { Row: AnyRow }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
  };
}
