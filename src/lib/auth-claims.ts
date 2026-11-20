/** Helpers for reading a verified JWT claims object from supabase.auth.getClaims(). */

type ClaimsLike = {
  sub?: unknown
  username?: unknown
  user_metadata?: unknown
} | null | undefined

function readUsername(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const name = value.trim()
  return name || null
}

/**
 * Username stored on the user at sign-up (user_metadata.username).
 * Used only for display (profile link, “@name”). Not for admin or write checks.
 */
export function usernameFromClaims(claims: ClaimsLike): string | null {
  if (!claims) return null
  const meta = claims.user_metadata
  if (meta && typeof meta === 'object' && 'username' in meta) {
    const fromMeta = readUsername((meta as { username?: unknown }).username)
    if (fromMeta) return fromMeta
  }
  return readUsername(claims.username)
}

export function userIdFromClaims(claims: ClaimsLike): string | null {
  return typeof claims?.sub === 'string' && claims.sub ? claims.sub : null
}
