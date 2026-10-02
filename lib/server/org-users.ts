/**
 * Loads an org's members as `BoardUser`s, so real-data screens render the same
 * avatars, names and colours the mock screens do.
 *
 * Real profiles have no stored colour, so one is derived deterministically from
 * the user id — the same member keeps the same colour across every screen.
 */
import 'server-only';
import { colorForId, initialsFor, type BoardUser } from '@/lib/board';

export async function fetchOrgUsers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orgId: string
): Promise<BoardUser[]> {
  const { data } = await supabase
    .from('org_members')
    .select('user_id, role, profiles(id, full_name, email)')
    .eq('org_id', orgId)
    .is('deleted_at', null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const id = p?.id ?? row.user_id;
    const name = p?.full_name || p?.email || 'Unknown member';
    return {
      id,
      name,
      email: p?.email ?? undefined,
      role: row.role,
      color: colorForId(id),
      initials: initialsFor(p?.full_name || p?.email),
    } satisfies BoardUser;
  });
}
