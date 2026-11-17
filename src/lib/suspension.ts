/** Plain copy for the "you're suspended" block shown instead of a write form. Pure, so it can be unit tested. */
export function suspendedBlockCopy(action: string, reason: string | null | undefined) {
  const cleaned = typeof reason === 'string' ? reason.trim() : ''
  return {
    heading: 'Your account is suspended',
    body: `You can’t ${action} until a moderator lifts the suspension. You can still browse and delete your own posts.`,
    reason: cleaned || null,
  }
}
