// deno-lint-ignore-file no-explicit-any
import { getServiceClient } from './supabase.ts';

/**
 * Returns true when the two users have a mutual match in the `matches` table.
 *
 * Matches are stored with the initiator on `user_id` and the matched user on
 * `match_user_id`, so we look both directions and consider any single row a
 * match.
 *
 * Self-match (same uuid on both sides) always resolves to false so this can
 * be used to gate self-messaging too.
 */
export async function areUsersMatched(
  userA: string,
  userB: string,
): Promise<boolean> {
  if (!userA || !userB || userA === userB) return false;

  const supabase = getServiceClient();
  const { count, error } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .or(
      `and(user_id.eq.${userA},match_user_id.eq.${userB}),` +
      `and(user_id.eq.${userB},match_user_id.eq.${userA})`,
    );

  if (error) {
    console.error('Error checking match status:', error);
    // Fail closed — if we can't verify, deny.
    return false;
  }
  return (count ?? 0) > 0;
}
