/** Production origin, used when no site URL is configured. */
export const PRODUCTION_SITE_URL = 'https://social-sips-livid.vercel.app'

/**
 * Trusted absolute origin of the site (no trailing slash) for links we hand to third parties,
 * e.g. Supabase Auth's emailRedirectTo. Comes from config (NEXT_PUBLIC_SITE_URL), never from
 * request headers, so a forged Origin/Host can't point confirmation emails at another site.
 */
export function siteUrl(configured: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string {
  const raw = configured?.trim()
  if (!raw) return PRODUCTION_SITE_URL
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname))) return PRODUCTION_SITE_URL
    return u.origin
  } catch {
    return PRODUCTION_SITE_URL
  }
}
