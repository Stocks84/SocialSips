/**
 * Exclusions for the admin “members toward 50” count.
 * Keep this list small and explicit. IDs and usernames are compared as written
 * (usernames are lowercased first, matching how sign-up stores them).
 *
 * - SEED_AUTHOR_ID: demo/seed author from supabase/seed.sql
 * - EXCLUDED_USERNAMES: Will’s accounts (neon_host, willow) and the test bot
 */
export const SEED_AUTHOR_ID = '00000000-0000-0000-0000-000000000001'
export const EXCLUDED_USERNAMES = ['neon_host', 'willow', 'ss_test_bot'] as const
export const MEMBER_GOAL = 50

export type MemberRow = { id: string; username: string | null }

/** True if this profile should not count toward the first-50 total. */
export function isExcludedMember(row: MemberRow): boolean {
  if (row.id === SEED_AUTHOR_ID) return true
  const name = (row.username ?? '').trim().toLowerCase()
  return (EXCLUDED_USERNAMES as readonly string[]).includes(name)
}

/** How many of `rows` count as real members toward MEMBER_GOAL. */
export function countTowardGoal(rows: MemberRow[]): number {
  return rows.filter((row) => !isExcludedMember(row)).length
}
