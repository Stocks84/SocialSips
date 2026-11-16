/** Production origin, used when no site URL is configured. */
export const PRODUCTION_SITE_URL = 'https://social-sips-livid.vercel.app'

/**
 * Trusted absolute origin of the site (no trailing slash) for links we hand to third parties
 * (share previews, metadataBase, Supabase Auth emailRedirectTo). Comes from config
 * (NEXT_PUBLIC_SITE_URL), then Vercel's production domain, then the hardcoded fallback —
 * never from request headers, so a forged Host can't point confirmation emails or OG URLs
 * at another site.
 */
export function siteUrl(
  configured: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
  vercelProductionUrl: string | undefined = process.env.VERCEL_PROJECT_PRODUCTION_URL,
): string {
  return originOf(configured) ?? originOf(withHttps(vercelProductionUrl)) ?? PRODUCTION_SITE_URL
}

/** VERCEL_PROJECT_PRODUCTION_URL is a hostname; allow a full URL too. */
function withHttps(raw: string | undefined): string | undefined {
  const v = raw?.trim()
  if (!v) return undefined
  return /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`
}

function originOf(raw: string | undefined): string | null {
  const v = raw?.trim()
  if (!v) return null
  try {
    const u = new URL(v)
    if (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname))) {
      return null
    }
    return u.origin
  } catch {
    return null
  }
}
