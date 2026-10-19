/**
 * PostgREST filter: visible posts, plus the viewer's own hidden ones (RLS enforces the same rule,
 * migration 0012). Admin moderation views query hidden rows separately.
 */
/** Filter for opening one post: admins match hidden and visible (RLS decides), everyone else gets visibleTo(). */
export function parentVisibleTo(userId: string | null | undefined, isAdmin: boolean): string {
  return isAdmin ? 'is_hidden.eq.false,is_hidden.eq.true' : visibleTo(userId)
}

export function visibleTo(userId: string | null | undefined): string {
  return userId && /^[0-9a-f-]{36}$/i.test(userId) ? `is_hidden.eq.false,author_id.eq.${userId}` : 'is_hidden.eq.false'
}
